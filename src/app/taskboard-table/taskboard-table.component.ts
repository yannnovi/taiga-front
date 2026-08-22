import { Component, EventEmitter, Inject, Input, OnChanges, OnInit, Output } from "@angular/core";
import { CdkDragDrop } from "@angular/cdk/drag-drop";
import { AJS_DUE_DATE_SERVICE, AJS_PROJECT_SERVICE, AJS_TG_RESOURCES } from "../shared/ajs-tokens";

/**
 * Angular replacement for the AngularJS `tgTaskboardSortable` directive
 * (app/coffee/modules/taskboard/sortable.coffee), downgraded in place under the same
 * name - but unlike the four previous dragula -> @angular/cdk/drag-drop modules, this one
 * had to internalize the ENTIRE taskboard table (not just the drag wrapper), because
 * @angular/cdk/drag-drop's `cdkDropListGroup` requires every connected `cdkDropList` to be
 * a descendant of the same Angular component tree - dragula has no such requirement, and
 * the original dragged tasks across *every* `.taskboard-column` cell on the whole board
 * (all user-story rows x all status columns), reassigning a task's user story as well as
 * its status. See MIGRATION_ROADMAP.md for the full scoping writeup.
 *
 * `taskboard-table.jade` was NOT the template of an isolate-scope directive - it was
 * inline markup on the same ambient `$scope` as the route-level `TaskboardController`
 * (app/coffee/modules/taskboard/main.coffee, 921 lines, untouched apart from removing the
 * squish-column directive below). The `.issues-wrapper`/`tg-issues-table` section that
 * follows the table in `taskboard.jade` is unrelated to task dragging and stays exactly
 * as-is, out of scope.
 *
 * **Fold state and column-width computation used to live on a completely separate
 * directive** (`tgTaskboardSquishColumn`) that only worked because it shared the same
 * ambient scope as the controller - `usFolded`/`statusesFolded` were never actually
 * defined on `TaskboardController` at all. Both are now owned directly by this component
 * (persisted the same way, via `$tgResources.tasks.get/storeStatusColumnModes` and
 * `get/storeUsRowModes` - `AJS_TG_RESOURCES`, not the smaller `AJS_RESOURCES`, since
 * these live in the `app/coffee/modules/resources/*.coffee` aggregator). Column widths
 * are recomputed reactively via template bindings instead of imperative jQuery `.css()`
 * calls.
 *
 * `ctrl.isMaximized`/`ctrl.isMinimized` (referenced in the original's `ng-class` but never
 * defined anywhere in the codebase - confirmed dead/orphaned, likely copy-pasted from
 * kanban) are omitted rather than replicated. `tg-taskboard-table-height-fixer` (no
 * matching directive registered anywhere) is dropped with no replacement.
 *
 * `tg-due-date`'s icon-only display mode (no `format` attr, used here) is replicated
 * inline via `AJS_DUE_DATE_SERVICE` rather than migrating the whole (shared, used
 * elsewhere) `tg-due-date` directive. `addnewtask.jade` (two icon buttons broadcasting
 * form-open events, no form of its own) and `taskboard-placeholder.jade` (two static
 * translated branches) are inlined directly - both confirmed to have no other caller.
 * `tg-belong-to-epics` (already Angular) is used natively.
 *
 * The original's permission gate for enabling drag at all reads oddly:
 * `if not (my_permissions.indexOf("modify_task") > -1) and project.archived_code then return`
 * - i.e. drag is skipped only when the user lacks permission AND the project is archived,
 * which in effect enables dragging whenever either condition doesn't hold. Replicated
 * exactly (via `sortingDisabled`), not "fixed" - a pre-existing quirk, not this
 * migration's to correct.
 *
 * **Bug fixed (found while migrating `tgLbCreateEdit`, unrelated to it):** `ngOnInit` used
 * to read `this.project.my_permissions` unconditionally, but `TaskboardController`'s own
 * project load hasn't always resolved yet the first time this component initializes -
 * throwing before `project`/`userstories`/`usTasks`/`taskStatusList` ever arrive. Worse:
 * since that exception aborted the surrounding change-detection pass, it was also breaking
 * rendering of *sibling* Angular components on the same page (e.g. a newly-opened
 * `tg-lb-create-edit` lightbox never showing its content). Fixed with a top-level
 * `*ngIf="project"` in the template (nothing renders until the real data exists) plus
 * defensive re-resolution (`initFromProject`, from both `ngOnInit` and `ngOnChanges`) and
 * null-tolerant width/task-lookup helpers, in case the various `@Input()`s arrive on
 * different digest cycles.
 */
@Component({
    selector: "tg-taskboard-sortable",
    templateUrl: "./taskboard-table.component.html",
})
export class TaskboardTableComponent implements OnInit, OnChanges {
    @Input() project: any;
    @Input() projectId: any;
    @Input() sprintId: any;
    @Input() userstories: any[];
    @Input() usTasks: any;
    @Input() tasksByUs: any;
    @Input() taskMap: any;
    @Input() usStatusById: any;
    @Input() taskStatusList: any[];
    @Input() zoom: any;
    @Input() zoomLevel: number;
    @Input() notFoundTasks: boolean;
    @Input() backToBacklogUrl: string;

    @Output() toggleFold = new EventEmitter<{ id: any }>();
    @Output() editTask = new EventEmitter<{ id: any }>();
    @Output() deleteTask = new EventEmitter<{ id: any }>();
    @Output() changeTaskAssignedTo = new EventEmitter<{ id: any }>();
    @Output() addNewTask = new EventEmitter<{ type: string; us: any }>();
    @Output() reorder = new EventEmitter<{ task: any; oldStatusId: any; newUsId: any; newStatusId: any; order: number }>();

    usFolded: Record<string, boolean> = {};
    statusesFolded: Record<string, boolean> = {};
    sortingDisabled = true;

    private statusColumnModesLoaded = false;

    private readonly gridGap = 5;
    private readonly horizontalPadding = 32;
    private readonly avatarWidth = 30;
    private readonly maxColumnWidth = 292;
    private readonly zoom0ColumnWidth = 182;
    private readonly minWidth = this.avatarWidth + this.horizontalPadding;
    private readonly maxRows = 3;

    constructor(
        @Inject(AJS_TG_RESOURCES) private rs: any,
        @Inject(AJS_PROJECT_SERVICE) private projectService: any,
        @Inject(AJS_DUE_DATE_SERVICE) private dueDateService: any,
    ) {}

    ngOnInit(): void {
        this.initFromProject();
    }

    ngOnChanges(): void {
        // `bind-project="project"` (an AngularJS `<` one-way binding) can still be
        // `undefined` the first time this component's own `ngOnInit` runs on a fresh/direct
        // navigation to a taskboard URL - `TaskboardController`'s own project load hasn't
        // resolved yet at that point. Re-attempt here once it (and `projectId`/`sprintId`)
        // actually arrive, same defensive-re-resolution pattern as
        // `MoveToSprintComponent.ngOnChanges`.
        if (!this.statusColumnModesLoaded) {
            this.initFromProject();
        }
    }

    private initFromProject(): void {
        if (!this.project || this.projectId === undefined || this.sprintId === undefined) {
            return;
        }

        this.sortingDisabled = !(
            this.project.my_permissions.indexOf("modify_task") > -1 || !this.project.archived_code
        );

        this.statusesFolded = this.rs.tasks.getStatusColumnModes(this.projectId);
        this.usFolded = this.rs.tasks.getUsRowModes(this.projectId, this.sprintId);
        this.statusColumnModesLoaded = true;
    }

    getTasksForColumn(usId: any, statusId: any): any {
        if (!this.usTasks) {
            return null;
        }

        if (usId) {
            return this.usTasks.getIn([usId.toString(), statusId.toString()]);
        }

        return this.usTasks.getIn(["null", statusId.toString()]);
    }

    getTaskById(taskId: any): any {
        return this.taskMap.get(taskId);
    }

    /** `usId` can be `null` for the storyless-tasks row - a plain index signature typed
     *  `Record<string, boolean>` doesn't accept `null` as a key even though JS itself
     *  coerces it to the string `"null"` at runtime (same key `getCeilWidth`/`getTasksForColumn`
     *  already rely on), so this wraps the lookup with an `any`-typed parameter instead of
     *  sprinkling `as any` through the template. */
    isUsFolded(usId: any): boolean {
        return !!this.usFolded[usId];
    }

    foldStatus(status: any): void {
        this.statusesFolded[status.id] = !this.statusesFolded[status.id];
        this.rs.tasks.storeStatusColumnModes(this.projectId, this.statusesFolded);
    }

    foldUs(usId: any): void {
        this.usFolded[usId] = !this.usFolded[usId];
        this.rs.tasks.storeUsRowModes(this.projectId, this.sprintId, this.usFolded);
    }

    private getCeilWidth(usId: any, statusId: any): number {
        const isStatusFolded = !!this.statusesFolded[statusId];
        const isUSFolded = this.isUsFolded(usId);
        const tasks = this.getTasksForColumn(usId, statusId)?.size;

        if (tasks && (isUSFolded || isStatusFolded)) {
            if (isUSFolded) {
                const columns = Math.ceil(tasks / this.maxRows);

                return this.avatarWidth * columns + (columns - 1) * this.gridGap + this.horizontalPadding;
            } else if (isStatusFolded) {
                return this.avatarWidth;
            }
        }

        return 0;
    }

    getColumnWidth(statusId: any): number {
        const isStatusFolded = !!this.statusesFolded[statusId];
        let initialWidth = this.maxColumnWidth;

        if (isStatusFolded) {
            initialWidth = this.avatarWidth;
        } else if (Number(this.zoomLevel) === 0) {
            initialWidth = this.zoom0ColumnWidth;
        }

        let width = this.getCeilWidth(null, statusId);

        if (width < initialWidth) {
            width = initialWidth;
        }

        (this.userstories || []).forEach((us: any) => {
            const usWidth = this.getCeilWidth(us.id, statusId);

            if (usWidth > width) {
                width = usWidth;
            }
        });

        return Math.max(width, this.minWidth);
    }

    getTaskboardWidth(): number {
        const total = (this.taskStatusList || []).reduce(
            (acc: number, status: any) => acc + this.getColumnWidth(status.id) + 5,
            0,
        );

        return this.maxColumnWidth + total;
    }

    canAddTask(): boolean {
        return this.projectService.canEdit("add_task");
    }

    dueDateColor(us: any): string {
        return this.dueDateService.color({ dueDate: us.due_date, isClosed: us.is_closed, objType: "us" });
    }

    dueDateTitle(us: any): string {
        return this.dueDateService.title({ dueDate: us.due_date, isClosed: us.is_closed, objType: "us" });
    }

    drop(event: CdkDragDrop<{ usId: any; statusId: any }>): void {
        const task = this.getTaskById(event.item.data);
        const oldStatusId = task.getIn(["model", "status"]);
        const newUsId = event.container.data.usId;
        const newStatusId = event.container.data.statusId;

        this.reorder.emit({ task, oldStatusId, newUsId, newStatusId, order: event.currentIndex });
    }
}
