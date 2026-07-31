import { AfterViewInit, Component, ElementRef, EventEmitter, Inject, Input, OnDestroy, OnInit, Output } from "@angular/core";
import { CdkDragDrop, CdkDragStart, CdkDragEnd } from "@angular/cdk/drag-drop";
import { AJS_KANBAN_USERSTORIES_SERVICE, AJS_PROJECT_SERVICE, AJS_ROOT_SCOPE, AJS_TG_RESOURCES } from "../shared/ajs-tokens";

/**
 * Angular replacement for the old AngularJS `tgKanbanSortable` directive
 * (app/coffee/modules/kanban/sortable.coffee), downgraded in place under the same name -
 * like `tgTaskboardSortable` before it, this had to internalize the ENTIRE kanban board
 * (swimlanes, statuses, cards), not just the drag wrapper, because `cdkDropListGroup`
 * requires every connected `cdkDropList` to be a descendant of the same Angular component
 * tree. Unlike taskboard, kanban had SEVEN separate AngularJS directives sharing the same
 * DOM subtree (all siblings on `.kanban-table` in the old `kanban-table.jade`), all of
 * which are absorbed here for the same reason: `tgKanban` (horizontal scroll header sync,
 * plus a `ResizeObserver`-driven `--kanban-width` CSS var), `tgKanbanSquishColumn`
 * (status-column fold state - was ambient scope, same "never actually on the controller"
 * situation as taskboard's `usFolded`/`statusesFolded`), `tgKanbanWipLimit` (was imperative
 * jQuery DOM insertion, now a pure computed marker), `tgKanbanSwimlane` (sticky swimlane
 * title + hover-to-auto-open-a-folded-swimlane-while-dragging), `tgKanbanTaskboardColumn`
 * (sticky task counter on column scroll), `tgKanbanArchivedShowStatusHeader` +
 * `tgKanbanArchivedStatusIntro` (lazy-load archived status columns -
 * `KanbanController.loadUserStoriesForStatus`/`hideUserStoriesForStatus` stay untouched in
 * the controller, this component only owns the two directives' DOM-level triggers, via
 * `$rootScope` broadcast/listen exactly as before).
 *
 * `tgKanban`'s other half - IntersectionObserver-based viewport-visibility tracking
 * (`initBoard()`/`app/js/boards.js`, gating `tg-card`'s `bind-in-view-port`) - is **not**
 * replicated. `tg-card` is called here with `[inViewPort]="true"` unconditionally, the same
 * simplification `TaskboardTableComponent` already made for its own (also potentially
 * large) board - see its two `[inViewPort]="true"` bindings. Consistent with that existing
 * precedent rather than a new one-off call.
 *
 * **Multi-select drag (`window.dragMultiple`) is out of scope** - a user-approved regression
 * already recorded in MIGRATION_ROADMAP.md for this whole batch of drag migrations (single-
 * item drag only, for now). `ctrl.selectedUss`/`toggleSelectedUs`/`cleanSelectedUss` are
 * removed from `KanbanController` entirely along with it - grepped and confirmed they served
 * no purpose beyond feeding that dead multi-drag flow and two CSS classes, one of which
 * (`ui-multisortable-multiple`) had no matching CSS rule at all.
 *
 * **Known, accepted regression: auto-opening a folded swimlane mid-drag no longer lets you
 * drop into it in the same gesture.** Verified directly in `@angular/cdk/drag-drop` source
 * (`drop-list-ref.mjs`): a drop list's connected siblings are resolved once, when the drag
 * gesture starts (`_draggingStarted()` -> `connectedTo()`), and never re-resolved for the
 * rest of that gesture - unlike dragula's `drake.containers.push(...)`, which accepted new
 * containers mid-drag. The swimlane still opens visually on hover (same 1s timer), but
 * completing a drop into it requires releasing and re-grabbing. Always rendering every
 * swimlane (never destroying folded ones) would avoid this, but was rejected for the perf
 * risk on boards with many swimlanes/cards - see MIGRATION_ROADMAP.md.
 *
 * `ctrl.isMaximized`/`ctrl.isMinimized` (referenced in the original's `ng-class` but never
 * defined anywhere - confirmed dead, same orphaned-copy-paste-from-taskboard situation
 * `TaskboardTableComponent`'s own doc comment already flags) are omitted, not replicated.
 * `.new`/`.vfold.new` (the dragula-era post-drop flash animation) is dropped, not
 * replicated, matching `TaskboardTableComponent.drop()`'s own precedent (a plain emit, no
 * flash class).
 */
@Component({
    selector: "tg-kanban-sortable",
    templateUrl: "./kanban-table.component.html",
})
export class KanbanTableComponent implements OnInit, AfterViewInit, OnDestroy {
    @Input() project: any;
    @Input() projectId: any;
    @Input() usByStatus: any;
    @Input() usByStatusSwimlanes: any;
    @Input() usMap: any;
    @Input() swimlanesList: any;
    @Input() swimlanesStatuses: any;
    @Input() usStatusList: any[];
    @Input() usStatusById: any;
    @Input() foldedSwimlane: any;
    @Input() movedUs: any[];
    @Input() renderInProgress: boolean;
    @Input() notFoundUserstories: boolean;
    @Input() zoom: any;
    @Input() zoomLevel: number;
    @Input() lastLoadUserstoriesParams: any;

    @Output() toggleFold = new EventEmitter<{ id: any }>();
    @Output() clickEdit = new EventEmitter<{ id: any }>();
    @Output() clickDelete = new EventEmitter<{ id: any }>();
    @Output() clickAssignedTo = new EventEmitter<{ id: any }>();
    @Output() clickMoveToTop = new EventEmitter<{ id: any }>();
    @Output() addNewUs = new EventEmitter<{ type: string; statusId: any }>();
    @Output() toggleSwimlane = new EventEmitter<{ id: any }>();
    @Output() reorder = new EventEmitter<{
        usList: Array<{ id: any }>;
        newStatusId: any;
        newSwimlaneId: any;
        index: number;
        previousCard: any;
        nextCard: any;
    }>();

    folds: Record<string, boolean> = {};
    unfold: any = null;
    isDragging = false;
    headerScrollX = 0;
    swimlaneScrollX: Record<string, number> = {};
    columnScrollY: Record<string, number> = {};

    private cardLinkParamsCache: Record<any, any> = {};
    private dragOrigin: { statusId: any; swimlaneId: any } | null = null;
    private enteredColumn: { statusId: any; swimlaneId: any } | null = null;
    private pendingSwimlaneOpen: { id: any; timeoutId: any; el: HTMLElement } | null = null;
    private resizeObserver: ResizeObserver | null = null;
    private unlisten: Array<() => void> = [];

    constructor(
        private el: ElementRef<HTMLElement>,
        @Inject(AJS_TG_RESOURCES) private rs: any,
        @Inject(AJS_PROJECT_SERVICE) private projectService: any,
        @Inject(AJS_KANBAN_USERSTORIES_SERVICE) private kanbanUserstoriesService: any,
        @Inject(AJS_ROOT_SCOPE) private rootScope: any,
    ) {}

    ngOnInit(): void {
        this.folds = this.rs.kanban.getStatusColumnModes(this.projectId);

        this.usStatusList
            .filter((s: any) => s.is_archived)
            .forEach((s: any) => {
                this.folds[s.id] = true;
                this.kanbanUserstoriesService.addArchivedStatus(s.id);
                this.kanbanUserstoriesService.hideStatus(s.id);
            });

        this.unlisten.push(
            this.rootScope.$on("kanban:shown-userstories-for-status", (_e: any, statusId: any, uss: any) => {
                this.kanbanUserstoriesService.deleteStatus(statusId);
                this.kanbanUserstoriesService.add(uss);
            }),
        );
    }

    ngAfterViewInit(): void {
        this.watchKanbanWidth();
    }

    ngOnDestroy(): void {
        this.unlisten.forEach((fn) => fn());
        this.resizeObserver?.disconnect();
    }

    canModifyTask(): boolean {
        return this.project.my_permissions.indexOf("modify_task") > -1;
    }

    canAddUs(): boolean {
        return this.projectService.canEdit("add_us");
    }

    isSwimlaneMode(): boolean {
        return !!this.swimlanesList.size;
    }

    getUsIds(statusId: any, swimlaneId: any): any {
        if (swimlaneId != null) {
            return this.usByStatusSwimlanes.getIn([swimlaneId, statusId]);
        }

        return this.usByStatus.get(statusId.toString());
    }

    getUs(usId: any): any {
        return this.usMap.get(usId);
    }

    isUsInArchivedHiddenStatus(usId: any): boolean {
        return this.kanbanUserstoriesService.isUsInArchivedHiddenStatus(usId);
    }

    /**
     * Preserves the current swimlane/filter context when navigating to a US detail and
     * back. Ported from `KanbanController.getCardLinkParams` (see MIGRATION.md - moved here
     * rather than left as a controller round-trip since `lastLoadUserstoriesParams` is the
     * only controller state it actually needs, now passed down as a plain `@Input`.
     * Originally cached per item id to dodge an AngularJS `$digest` infinite-loop
     * (`[$rootScope:infdig] 10 $digest() iterations reached`) triggered by a fresh object
     * reference on every digest across the AngularJS/downgraded-component boundary - that
     * specific failure mode can't recur here (this component calls `tg-card` directly in
     * pure Angular-land, no `$digest` involved), but the cache is kept anyway to avoid
     * needless `tg-card` re-renders on every change-detection cycle.
     */
    getCardLinkParams(item: any): any {
        if (!this.lastLoadUserstoriesParams) {
            return {};
        }

        const params: any = { ...this.lastLoadUserstoriesParams };

        params.status = item.getIn(["model", "status"]);
        params.swimlane = item.getIn(["model", "swimlane"]);

        Object.keys(params).forEach((key) => {
            if (!params[key]) {
                delete params[key];
            }
        });

        if (this.swimlanesList.size && !params.swimlane) {
            params.swimlane = "null";
        }

        const parsedParams: any = {};

        Object.keys(params).forEach((key) => {
            parsedParams[`kanban-${key}`] = params[key];
        });

        const itemId = item.get("id");
        const cached = this.cardLinkParamsCache[itemId];

        if (cached && JSON.stringify(cached) === JSON.stringify(parsedParams)) {
            return cached;
        }

        this.cardLinkParamsCache[itemId] = parsedParams;

        return parsedParams;
    }

    showPlaceholder(statusId: any, swimlaneId: any): boolean {
        const firstStatus = this.usStatusList[0].id === statusId && !this.kanbanUserstoriesService.userstoriesRaw.length;

        if (swimlaneId != null) {
            const firstSwimlane = this.swimlanesList.first().id === swimlaneId;

            return firstStatus && firstSwimlane;
        }

        return firstStatus;
    }

    // Status-column fold state - was `tgKanbanSquishColumn`, ambient-scope-only before.
    foldStatus(status: any): void {
        this.unfold = null;
        this.folds[status.id] = !this.folds[status.id];

        if (!this.folds[status.id]) {
            this.unfold = status.id;
        }

        this.rs.kanban.storeStatusColumnModes(this.projectId, this.folds);

        if (
            this.kanbanUserstoriesService.archivedStatus.includes(status.id) &&
            !this.kanbanUserstoriesService.statusHide.includes(status.id)
        ) {
            this.kanbanUserstoriesService.hideStatus(status.id);
        }
    }

    // Archived-status lazy-load - was `tgKanbanArchivedShowStatusHeader`.
    showArchivedStatus(statusId: any): void {
        if (this.kanbanUserstoriesService.statusHide.includes(statusId)) {
            this.rootScope.$broadcast("kanban:show-userstories-for-status", statusId);
            this.kanbanUserstoriesService.showStatus(statusId);
        }
    }

    // WIP limit marker - was `tgKanbanWipLimit`'s imperative jQuery DOM insertion.
    getWipLimitMarker(status: any, ids: any[]): { afterIndex: number; cssClass: string } | null {
        if (!status || status.is_archived || !status.wip_limit) {
            return null;
        }

        const n = ids ? ids.length : 0;

        if (n + 1 === status.wip_limit) {
            return { afterIndex: n - 1, cssClass: "one-left" };
        } else if (n === status.wip_limit) {
            return { afterIndex: n - 1, cssClass: "reached" };
        } else if (n > status.wip_limit) {
            return { afterIndex: status.wip_limit - 1, cssClass: "exceeded" };
        }

        return null;
    }

    // Horizontal scroll sync - was `tgKanban`'s `kanbanTableLoaded` handler.
    onTableBodyScroll(event: Event, swimlaneId: any): void {
        const scrollLeft = (event.target as HTMLElement).scrollLeft;

        this.headerScrollX = -scrollLeft;

        if (swimlaneId != null) {
            this.swimlaneScrollX[swimlaneId] = -scrollLeft;
        }
    }

    // Sticky task counter - was `tgKanbanTaskboardColumn`.
    onColumnScroll(event: Event, statusId: any, swimlaneId: any): void {
        this.columnScrollY[this.columnKey(statusId, swimlaneId)] = (event.target as HTMLElement).scrollTop;
    }

    columnKey(statusId: any, swimlaneId: any): string {
        return `${swimlaneId}:${statusId}`;
    }

    // Sticky swimlane title hover-to-auto-open - was `tgKanbanSwimlane`.
    onSwimlaneTitleMouseOver(event: MouseEvent, swimlaneId: any): void {
        if (this.pendingSwimlaneOpen && this.pendingSwimlaneOpen.id === swimlaneId) {
            return;
        }

        if (this.pendingSwimlaneOpen) {
            clearTimeout(this.pendingSwimlaneOpen.timeoutId);
            this.pendingSwimlaneOpen.el.classList.remove("pending-to-open");
            this.pendingSwimlaneOpen = null;
        }

        const swimlaneEl = event.currentTarget as HTMLElement;

        if (!swimlaneEl.classList.contains("folded") || !this.isDragging) {
            return;
        }

        swimlaneEl.classList.add("pending-to-open");

        const timeoutId = setTimeout(() => {
            swimlaneEl.classList.remove("pending-to-open");
            this.toggleSwimlane.emit({ id: swimlaneId });
        }, 1000);

        this.pendingSwimlaneOpen = { id: swimlaneId, timeoutId, el: swimlaneEl };
    }

    onSwimlaneTitleMouseLeave(): void {
        if (this.pendingSwimlaneOpen) {
            clearTimeout(this.pendingSwimlaneOpen.timeoutId);
            this.pendingSwimlaneOpen.el.classList.remove("pending-to-open");
            this.pendingSwimlaneOpen = null;
        }
    }

    onDragStarted(event: CdkDragStart<{ usId: any }>, statusId: any, swimlaneId: any): void {
        this.isDragging = true;
        this.dragOrigin = { statusId, swimlaneId };
    }

    onDragEnded(event: CdkDragEnd<{ usId: any }>): void {
        this.isDragging = false;
        this.dragOrigin = null;
        this.enteredColumn = null;
    }

    // `.target-drop` hover highlight - was dragula's `over`/`out` events. `entered`/`exited`
    // fire only on actual pointer enter/exit of a given cdkDropList (unlike the built-in
    // `.cdk-drop-list-receiving` class, which CDK applies to *every* connected list for the
    // whole gesture - verified in `drop-list-ref.mjs` - not equivalent to dragula's
    // per-hover `over`/`out`).
    onDropListEntered(statusId: any, swimlaneId: any): void {
        if (this.dragOrigin && (this.dragOrigin.statusId !== statusId || this.dragOrigin.swimlaneId !== swimlaneId)) {
            this.enteredColumn = { statusId, swimlaneId };
        }
    }

    onDropListExited(statusId: any, swimlaneId: any): void {
        if (this.enteredColumn && this.enteredColumn.statusId === statusId && this.enteredColumn.swimlaneId === swimlaneId) {
            this.enteredColumn = null;
        }
    }

    isTargetDrop(statusId: any, swimlaneId: any): boolean {
        return !!this.enteredColumn && this.enteredColumn.statusId === statusId && this.enteredColumn.swimlaneId === swimlaneId;
    }

    drop(event: CdkDragDrop<{ statusId: any; swimlaneId: any }>): void {
        const usId = event.item.data;
        const newStatusId = event.container.data.statusId;
        const newSwimlaneId = event.container.data.swimlaneId;

        const rawList = this.getUsIds(newStatusId, newSwimlaneId);
        const destIds: any[] = (rawList ? rawList.toJS() : []).filter((id: any) => id !== usId);

        const index = event.currentIndex;
        const previousCard = index > 0 ? destIds[index - 1] : null;
        const nextCard = !previousCard && index < destIds.length ? destIds[index] : null;

        this.reorder.emit({
            usList: [{ id: usId }],
            newStatusId,
            newSwimlaneId,
            index,
            previousCard,
            nextCard,
        });
    }

    private watchKanbanWidth(): void {
        const columns = Array.from(this.el.nativeElement.querySelectorAll<HTMLElement>(".task-colum-name"));
        const kanbanStyles = getComputedStyle(this.el.nativeElement.querySelector(".kanban-table") || this.el.nativeElement);
        const columnMargin = Number(
            kanbanStyles.getPropertyValue("--kanban-column-margin").trim().replace("px", "").split(" ")[1] || 0,
        );

        const resizeCb = () => {
            const width = columns.reduce((acc, column) => {
                if (document.body.contains(column)) {
                    return acc + column.offsetWidth + columnMargin;
                }

                this.resizeObserver?.unobserve(column);

                return acc;
            }, 0);

            if (width > 0) {
                document.body.style.setProperty("--kanban-width", `${width - columnMargin}px`);
            }
        };

        this.resizeObserver = new ResizeObserver(resizeCb);
        columns.forEach((column) => this.resizeObserver?.observe(column));
    }
}
