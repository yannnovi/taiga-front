import { Component, EventEmitter, Inject, Input, OnChanges, OnDestroy, OnInit, Output } from "@angular/core";
import { CdkDragDrop } from "@angular/cdk/drag-drop";
import { AJS_DUE_DATE_SERVICE, AJS_ROOT_SCOPE, AJS_TRANSLATE } from "../shared/ajs-tokens";
import { BacklogDropListsService, sprintDropListId } from "./backlog-drop-lists.service";

declare const $: any;
declare const moment: any;

export interface SprintMoveUsEvent {
    usList: any[];
    index: number;
    sprintId: number;
    previousUs: number | null;
    nextUs: number | null;
}

/**
 * Angular replacement for the backlog's sprint sidebar (`app/partials/includes/modules/
 * sprints.jade`), downgraded as `tg-backlog-sprints`. Absorbs all four AngularJS
 * directives of `app/coffee/modules/backlog/sprints.coffee`, which only ever worked
 * together on the ambient `BacklogController` scope:
 * - `tgBacklogSprint` (expand/collapse, closed-sprint styling, "edit sprint" link),
 * - `tgBacklogSprintHeader` (`$compile`d header: name, taskboard link, dates, points),
 * - `tgBacklogToggleClosedSprintsVisualization` (show/hide closed sprints + spinner),
 * - `tgSprint` (`backlog/sprint.jade`: progress bar, user story rows, taskboard button).
 *
 * Communication with `BacklogController` is kept exactly as before: `$rootScope`
 * broadcasts for `sprintform:edit`, `backlog:load-closed-sprints` and
 * `backlog:unload-closed-sprints` (the controller and the sprint lightbox already listen
 * for those), `closed-sprints:reloaded` to stop the spinner, and outputs for
 * `ctrl.addNewSprint()` / `ctrl.moveUs(...)`.
 *
 * **Drag & drop restored**: every sprint table is a `cdkDropList` connected (by id, see
 * `BacklogDropListsService`) to the backlog table and to the other sprints - backlog ->
 * sprint (including the checkbox multi-selection), sprint -> backlog, sprint -> sprint and
 * reordering inside a sprint, all through the unchanged `ctrl.moveUs`, which was the
 * regression accepted when the backlog table was migrated.
 *
 * Deliberate behaviour changes (both were frozen as "NOTE (current behaviour)" in
 * `sprints.spec.coffee` before this migration):
 * - the expanded/collapsed state is per sprint id and only changes on click - the old
 *   `$watch` toggled an open sprint again whenever `loadSprints()` replaced the sprint
 *   object, so an expanded sprint collapsed after every reload;
 * - the shown/hidden state of closed sprints is derived from `closedSprints` itself
 *   instead of a flag in the directive factory closure that was shared by every instance
 *   and survived leaving the page (while the controller restarted with them hidden).
 */
@Component({
    selector: "tg-backlog-sprints",
    templateUrl: "./backlog-sprints.component.html",
})
export class BacklogSprintsComponent implements OnInit, OnChanges, OnDestroy {
    @Input() project: any;
    @Input() sprints: any[] = [];
    @Input() closedSprints: any[] = [];
    @Input() totalMilestones: number;
    @Input() totalClosedMilestones: number;

    @Output() addSprint = new EventEmitter<void>();
    @Output() moveUs = new EventEmitter<SprintMoveUsEvent>();

    readonly connectedIds: string[];
    readonly emptySprintImage = `${(window as any)._version}/images/empty/empty_sprint.png`;
    readonly spinnerSrc = `${(window as any)._version}/svg/spinner-circle.svg`;

    loadingClosedSprints = false;
    sortingDisabled = true;

    private expanded = new Map<number, boolean>();
    private unwatchClosedReloaded: () => void;

    constructor(
        private dropLists: BacklogDropListsService,
        @Inject(AJS_ROOT_SCOPE) private rootScope: any,
        @Inject(AJS_TRANSLATE) private translate: any,
        @Inject(AJS_DUE_DATE_SERVICE) private dueDateService: any,
    ) {
        this.connectedIds = dropLists.connectedIds;
    }

    ngOnInit(): void {
        this.unwatchClosedReloaded = this.rootScope.$on("closed-sprints:reloaded", () => {
            this.loadingClosedSprints = false;
        });
    }

    ngOnChanges(): void {
        if (this.project) {
            // same rule as BacklogTableComponent (and the original tgBacklogSortable)
            this.sortingDisabled = this.project.my_permissions.indexOf("modify_us") === -1 && !this.project.archived_code;
        }

        const renderedIds = [...this.openSprints, ...(this.closedSprints || [])].map((sprint) => sprint.id);

        this.dropLists.setSprints(renderedIds);

        // A sprint that leaves the DOM (e.g. closed sprints hidden) comes back with its
        // default CSS state (open expanded, closed collapsed) - forget its toggled state so
        // the arrow matches.
        for (const id of Array.from(this.expanded.keys())) {
            if (!renderedIds.includes(id)) {
                this.expanded.delete(id);
            }
        }
    }

    ngOnDestroy(): void {
        this.unwatchClosedReloaded?.();
        this.dropLists.setSprints([]);
    }

    get openSprints(): any[] {
        return (this.sprints || []).filter((sprint) => !sprint.closed);
    }

    get closedSprintsShown(): boolean {
        return !!this.closedSprints?.length;
    }

    trackById(_index: number, item: any): any {
        return item.id;
    }

    dropListId(sprint: any): string {
        return sprintDropListId(sprint.id);
    }

    hasPermission(permission: string): boolean {
        return this.project?.my_permissions.indexOf(permission) !== -1;
    }

    // Sprint header (was tgBacklogSprintHeader)

    isEditable(): boolean {
        return !this.project.archived_code && this.hasPermission("modify_milestone");
    }

    estimatedDateRange(sprint: any): string {
        const prettyDate = this.translate.instant("BACKLOG.SPRINTS.DATE");
        const start = moment(sprint.estimated_start).format(prettyDate);
        const finish = moment(sprint.estimated_finish).format(prettyDate);

        return `${start}-${finish}`;
    }

    progress(sprint: any): number {
        const percentage = (100 * sprint.closed_points) / sprint.total_points;

        return isFinite(percentage) ? Math.min(100, Math.max(0, percentage)) : 0;
    }

    // Expand/collapse (was tgBacklogSprint)

    isExpanded(sprint: any): boolean {
        return this.expanded.has(sprint.id) ? this.expanded.get(sprint.id)! : !sprint.closed;
    }

    toggleSprint(sprint: any, event: Event): void {
        event.preventDefault();

        this.expanded.set(sprint.id, !this.isExpanded(sprint));

        $((event.currentTarget as HTMLElement).closest(".sprint")).find(".sprint-table").slideToggle({
            duration: 500,
            easing: "linear",
        });
    }

    editSprint(sprint: any, event: Event): void {
        event.preventDefault();
        this.rootScope.$broadcast("sprintform:edit", sprint);
    }

    // Closed sprints (was tgBacklogToggleClosedSprintsVisualization)

    toggleClosedSprints(event: Event): void {
        event.preventDefault();

        this.loadingClosedSprints = true;

        if (this.closedSprintsShown) {
            this.rootScope.$broadcast("backlog:unload-closed-sprints");
        } else {
            this.rootScope.$broadcast("backlog:load-closed-sprints");
        }
    }

    // User story rows (was backlog/sprint.jade)

    dueDateColor(us: any): string {
        return this.dueDateService.color({ dueDate: us.due_date, isClosed: us.is_closed, objType: "us" });
    }

    dueDateTitle(us: any): string {
        const date = this.dueDateService.title({ dueDate: us.due_date, isClosed: us.is_closed, objType: "us" });

        return this.translate.instant("COMMON.CARD.DUE_DATE", { date });
    }

    // Drag & drop (was the sprint half of tgBacklogSortable's shared dragula instance)

    drop(event: CdkDragDrop<any>, sprint: any): void {
        if (event.previousContainer === event.container && event.previousIndex === event.currentIndex) {
            return;
        }

        const us = event.item.data;
        const items = [...sprint.user_stories];
        const draggedIndex = items.indexOf(us);

        if (draggedIndex !== -1) {
            items.splice(draggedIndex, 1);
        }

        const previousUs = event.currentIndex > 0 ? items[event.currentIndex - 1]?.id ?? null : null;
        const nextUs = !previousUs ? items[event.currentIndex]?.id ?? null : null;

        this.moveUs.emit({
            usList: this.buildDropUsList(us, event),
            index: event.currentIndex,
            sprintId: sprint.id,
            previousUs,
            nextUs,
        });
    }

    /** A row dragged from the backlog drags every checked row along (see
     *  `BacklogTableComponent.buildDropUsList`, same DOM-based selection). */
    private buildDropUsList(draggedUs: any, event: CdkDragDrop<any>): any[] {
        const draggedEl = event.item.element.nativeElement as HTMLElement;
        const sourceItems: any[] = event.previousContainer.data?.items;

        if (!sourceItems || !draggedEl.classList.contains("ui-multisortable-multiple")) {
            return [draggedUs];
        }

        const selectedIds = Array.from(
            draggedEl.closest(".backlog-table-body")?.querySelectorAll(".ui-multisortable-multiple") ?? [],
        ).map((row) => Number((row as HTMLElement).dataset["id"]));

        const selectedUsList = sourceItems.filter((it) => selectedIds.includes(it.id));

        return selectedUsList.length > 1 ? selectedUsList : [draggedUs];
    }
}
