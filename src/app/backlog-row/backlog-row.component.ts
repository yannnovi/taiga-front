import { Component, EventEmitter, Inject, Input, OnChanges, Output, SimpleChanges } from "@angular/core";
import { AJS_DUE_DATE_SERVICE, AJS_QUEUE, AJS_REPO } from "../shared/ajs-tokens";

declare const $: any;

/**
 * One row of the backlog table (`backlog-row.jade` in the original, an inline `include`
 * with no directive/component boundary of its own) - absorbs three ambient AngularJS
 * directives that only worked because they shared the row's own scope, all confirmed to
 * have zero isolate binding:
 *
 * - `tgUsStatus` (`app/coffee/modules/common/popovers.coffee`): the status badge + its
 *   change-status popover. Read `$scope.usStatusById`/`project` directly, rendered a
 *   Lodash-templated `<ul class="pop-status">` and toggled it via the jQuery `.popover()`
 *   plugin (`common/popovers.coffee`'s own `$.fn.popover`, a generic open/close/fade
 *   helper reused as-is here via `declare const $: any` - not `taiga.globalPopover`, whose
 *   `.global-popover` markup/CSS doesn't match this widget's existing `.pop-status`
 *   styling).
 * - `tgBacklogUsPoints` (`backlog/main.coffee`): delegated to `$tgEstimationsService`
 *   (`common/estimation.coffee`), which does its OWN DOM manipulation independently of the
 *   calling directive (`create()` unbinds/rebinds click handlers, `renderPointsSelector()`
 *   injects a Lodash-templated popover). `calculateTotalPoints`/`calculateRoles` are pure
 *   computations, ported directly as getters; the popover rendering is reimplemented as
 *   real Angular template state (`pointsPopoverMode`/`pointsPopoverItems`) instead of
 *   string-templated HTML injection. Saves go through `AJS_REPO`/`AJS_QUEUE` directly
 *   (the same `$tgRepo`/`$tgQqueue` the service used internally) rather than keeping
 *   `$tgEstimationsService` in the loop - `$tgEstimationsService` itself is untouched,
 *   still used elsewhere (`tgLbUsEstimation`/`tgUsEstimation`), out of scope here.
 * - `tgUsEditSelector` (`backlog/main.coffee`): the Edit/Delete/Move-to-top menu,
 *   `$compile`d against the live scope on every click. Its actions map 1:1 to
 *   `@Output()`s here, bridged by the caller to `ctrl.editUserStory`/`ctrl.deleteUserStory`/
 *   `ctrl.moveUsToTopOfBacklog`.
 *
 * The row's checkbox is kept, but without its original `ng-model="vm.filterMode"` (`vm`
 * matches no alias anywhere in `BacklogController` or any ancestor scope - that specific
 * binding was dead). The checkbox itself is very much alive: `tgBacklog`'s ambient
 * `linkToolbar` (`app/coffee/modules/backlog/main.coffee`, untouched by this migration)
 * listens for raw `change` events on any `.backlog-table-body input:checkbox`, entirely
 * independent of Angular - it drives both the "move to sprint" bulk-action buttons AND
 * (via the `ui-multisortable-multiple` class it toggles) the multi-select drag rebuilt
 * below. Dropping the checkbox markup silently broke both until this was caught and fixed
 * (see MIGRATION.md).
 *
 * `prepareMultiCount` (bound to `(mousedown)`, i.e. before any drag gesture can begin) sets
 * a `data-multi-count` attribute that CDK's default drag preview - a DOM clone of the
 * dragged row - carries along automatically, styled into a "+N" badge (`backlog.scss`).
 * Mirrors the same mechanism used for kanban's multi-select drag (see
 * `KanbanColumnComponent`/`kanban-table.scss`) - see `BacklogTableComponent.drop()` for how
 * the actual grouped reorder is built from the DOM's `ui-multisortable-multiple` rows at
 * drop time (backlog's selection has no Angular-side state to read at all, unlike kanban's
 * `selectedUss`).
 */
@Component({
    selector: "tg-backlog-row",
    templateUrl: "./backlog-row.component.html",
})
export class BacklogRowComponent implements OnChanges {
    @Input() project: any;
    @Input() us: any;
    @Input() isFirst: boolean;
    @Input() showTags: boolean;
    @Input() linkParams: any;
    @Input() sortingDisabled: boolean;
    @Input() displayRoleId: any = null;

    @Output() changeStatus = new EventEmitter<{ us: any; statusId: any }>();
    @Output() editUs = new EventEmitter<any>();
    @Output() deleteUs = new EventEmitter<any>();
    @Output() moveToTop = new EventEmitter<any>();

    canModify = false;
    canDelete = false;
    isEditable = false;
    pointsById: Record<string, any> = {};
    selectedRoleId: any = null;

    pointsPopoverMode: "roles" | "points" = "roles";
    pointsPopoverItems: any[] = [];

    constructor(
        @Inject(AJS_REPO) private repo: any,
        @Inject(AJS_QUEUE) private qqueue: any,
        @Inject(AJS_DUE_DATE_SERVICE) private dueDateService: any,
    ) {}

    ngOnChanges(changes: SimpleChanges): void {
        this.canModify = this.project.my_permissions.indexOf("modify_us") > -1;
        this.canDelete = this.project.my_permissions.indexOf("delete_us") > -1;
        this.isEditable = !this.project.archived_code && this.canModify;

        this.pointsById = {};
        (this.project.points || []).forEach((p: any) => {
            this.pointsById[p.id] = p;
        });

        if (changes["displayRoleId"]) {
            this.selectedRoleId = this.displayRoleId;
        }
    }

    private get totalPoints(): number | string {
        const values = Object.keys(this.us.points || {}).map((k) => this.pointsById[this.us.points[k]]?.value);

        if (values.length === 0) {
            return "?";
        }

        const notNull = values.filter((v) => v !== null && v !== undefined);

        if (notNull.length === 0) {
            return "?";
        }

        return notNull.reduce((acc, n) => acc + n, 0);
    }

    /** Mirrors `UsPointsDirective`'s `estimationProcess.render()`: shows just the total,
     *  unless a role is selected (via this row's own points popover, or the header's
     *  role filter broadcasting into every row at once) and there's more than one
     *  computable role, in which case it shows "<role's point name> / <total>". */
    get pointsDisplay(): string {
        const roles = this.computableRoles;

        if (!this.selectedRoleId || roles.length === 1) {
            return `${this.totalPoints}`;
        }

        const pointId = this.us.points ? this.us.points[this.selectedRoleId] : undefined;
        const pointObj = this.pointsById[pointId];

        return `${pointObj?.name ?? "?"} / ${this.totalPoints}`;
    }

    get computableRoles(): any[] {
        return (this.project.roles || [])
            .filter((r: any) => r.computable)
            .map((role: any) => {
                const pointId = this.us.points ? this.us.points[role.id] : undefined;
                const pointObj = this.pointsById[pointId];

                return { ...role, pointsLabel: pointObj?.name ? pointObj.name : "?" };
            });
    }

    dueDateColor(): string {
        return this.dueDateService.color({ dueDate: this.us.due_date, isClosed: this.us.is_closed, objType: "us" });
    }

    dueDateTitle(): string {
        return this.dueDateService.title({ dueDate: this.us.due_date, isClosed: this.us.is_closed, objType: "us" });
    }

    statusColor(): string {
        return this.project.us_statuses.find((s: any) => s.id === this.us.status)?.color || "";
    }

    statusName(): string {
        return this.project.us_statuses.find((s: any) => s.id === this.us.status)?.name || "";
    }

    openStatusPopover(event: MouseEvent): void {
        const el = $((event.currentTarget as HTMLElement).closest(".status")).find(".pop-status");

        el.popover().open();
    }

    selectStatus(statusId: any, event: MouseEvent): void {
        $((event.currentTarget as HTMLElement).closest(".status")).find(".pop-status").popover().close();

        const previousStatus = this.us.status;

        this.us.status = statusId;

        this.repo.save(this.us).then(() => {
            this.changeStatus.emit({ us: this.us, statusId });
        }, () => {
            this.us.status = previousStatus;
        });
    }

    openPointsPopover(event: MouseEvent): void {
        if (!this.isEditable) {
            return;
        }

        const roles = this.computableRoles;

        if (roles.length === 0) {
            return;
        }

        if (roles.length === 1) {
            this.selectedRoleId = Object.keys(this.us.points || {})[0] ?? roles[0].id;
            this.showPointsSelector(this.selectedRoleId);
        } else if (this.selectedRoleId) {
            this.showPointsSelector(this.selectedRoleId);
        } else {
            this.showRolesSelector();
        }

        this.reopenPointsPopover(event.currentTarget as HTMLElement);
    }

    selectRole(roleId: any, event: MouseEvent): void {
        this.selectedRoleId = roleId;
        this.showPointsSelector(roleId);

        // `*ngIf` swaps in a brand-new `<ul>` for the points list (a different DOM element
        // than the roles list that was just closed) - it never got the jQuery `.popover()`
        // plugin's `active`/`fix` classes, so it must be opened again explicitly, the same
        // way the initial click in `openPointsPopover` does.
        this.reopenPointsPopover(event.currentTarget as HTMLElement);
    }

    private reopenPointsPopover(target: HTMLElement): void {
        const container = target.closest(".points");

        requestAnimationFrame(() => {
            $(container).find(".points-popover").popover().open();
        });
    }

    selectPoint(pointId: any, event: MouseEvent): void {
        $((event.currentTarget as HTMLElement).closest(".points")).find(".points-popover").popover().close();

        const points = { ...this.us.points, [this.selectedRoleId]: pointId };
        const previousPoints = this.us.points;

        this.us.points = points;

        this.qqueue.add(() => {
            return this.repo.save(this.us).then(
                () => {},
                () => {
                    this.us.points = previousPoints;
                },
            );
        });
    }

    private showRolesSelector(): void {
        this.pointsPopoverMode = "roles";
        this.pointsPopoverItems = this.computableRoles;
    }

    private showPointsSelector(roleId: any): void {
        this.pointsPopoverMode = "points";
        this.pointsPopoverItems = (this.project.points || []).map((point: any) => ({
            ...point,
            active: this.us.points && this.us.points[roleId] === point.id,
        }));
    }

    openOptionsPopover(event: MouseEvent): void {
        const button = event.currentTarget as HTMLElement;

        $(button.closest(".us-option")).find(".us-option-popup").popover().open(() => {
            button.classList.remove("popover-open");
        });

        button.classList.add("popover-open");
    }

    prepareMultiCount(event: MouseEvent): void {
        const row = event.currentTarget as HTMLElement;

        if (!row.classList.contains("ui-multisortable-multiple")) {
            row.removeAttribute("data-multi-count");
            return;
        }

        const selectedCount = row.closest(".backlog-table-body")?.querySelectorAll(".ui-multisortable-multiple").length ?? 0;

        if (selectedCount > 1) {
            row.setAttribute("data-multi-count", `${selectedCount - 1}`);
        } else {
            row.removeAttribute("data-multi-count");
        }
    }
}
