import {
    AfterViewInit,
    Component,
    ElementRef,
    EventEmitter,
    Inject,
    Input,
    OnDestroy,
    OnInit,
    Output,
    QueryList,
    ViewChild,
    ViewChildren,
} from "@angular/core";
import { CdkDragDrop } from "@angular/cdk/drag-drop";
import { AJS_KANBAN_USERSTORIES_SERVICE, AJS_PROJECT_SERVICE, AJS_ROOT_SCOPE, AJS_TG_RESOURCES } from "../shared/ajs-tokens";

/**
 * Angular replacement for the AngularJS `tgKanbanSortable` directive
 * (app/coffee/modules/kanban/sortable.coffee), downgraded in place under the same name -
 * same "internalize the whole board" pattern already used for `tgTaskboardSortable`
 * (`TaskboardTableComponent`), required because `cdkDropListGroup` needs every connected
 * `cdkDropList` to be an Angular-tree descendant. Kanban's board carries substantially
 * more ambient state than taskboard's did: `kanban-table.jade` (253 lines, inline markup
 * on the same `$scope` as the route-level `KanbanController`, 762 lines) was compiled with
 * FOUR directives sharing that one root element (`tgKanban`, `tgKanbanSwimlane`,
 * `tgKanbanSquishColumn`, `tgKanbanSortable`) plus FOUR more per status-column
 * (`tgKanbanTaskboardColumn`, `tgKanbanWipLimit`, `tgKanbanArchivedShowStatusHeader`,
 * `tgKanbanArchivedStatusIntro`). Per an explicit product decision (see
 * MIGRATION_ROADMAP.md), all of it is ported faithfully rather than trimmed - WIP limits,
 * sticky swimlane titles/counters, archived-column reveal, and swimlane
 * hover-to-auto-open-during-drag all included. The per-status-column pieces live in the
 * sibling `KanbanColumnComponent` (see its own doc comment); this component owns the
 * board-level shell: header, swimlane list, fold state, and the drag orchestration itself.
 *
 * **What's absorbed here specifically:**
 * - `tgKanbanSquishColumn`: column fold state (`folds`/`unfold`), persisted the same way
 *   (`$tgResources.kanban.get/storeStatusColumnModes` - `AJS_TG_RESOURCES`), including the
 *   original's auto-fold-archived-statuses-on-load behavior.
 * - `tgKanbanSwimlane`'s sticky-title scroll transform and the swimlane
 *   hover-to-auto-open-during-drag behavior (`mouseoverSwimlane`/`mouseleaveSwimlane`).
 *   The original detected "is a drag in progress" via
 *   `document.querySelectorAll('tg-card.gu-mirror').length` (a dragula artifact); replaced
 *   here with a plain `isDragging` flag toggled by `(cdkDragStarted)`/`(cdkDragEnded)`
 *   events bubbled up from `KanbanColumnComponent`.
 * - `tgKanban`'s header horizontal-scroll-sync (each swimlane/table body's own scroll
 *   translates the shared header) and its `ResizeObserver`-driven `--kanban-width` CSS var
 *   (yes, set on `document.body` in the original - replicated as-is, not scoped down, to
 *   avoid silently changing external CSS behavior). Its `initBoard()` IntersectionObserver
 *   card-visibility tracking (`app/js/boards.js`) is NOT ported here - that responsibility
 *   now lives per-column in `KanbanColumnComponent`, each with its own observer rooted at
 *   its own host element (matching `initBoard()`'s original `root: column` config), using
 *   `ViewChildren`/`IntersectionObserver` instead of the legacy global jQuery-ish utility.
 * - `tgKanbanArchivedShowStatusHeader` + `tgKanbanArchivedStatusIntro`: the archived-column
 *   reveal round-trip. Clicking "show archived" broadcasts
 *   `kanban:show-userstories-for-status`, which `KanbanController` still owns (it performs
 *   the actual data fetch - out of scope for a presentation component) and answers with
 *   `kanban:shown-userstories-for-status`; this component listens for that response once,
 *   board-wide, instead of once per archived-status-directive-instance as the original did
 *   (functionally identical, since each broadcast already carries its own `statusId`).
 *
 * **Multi-select drag** (`ctrl.selectedUss`/`toggleSelectedUs`, `window.dragMultiple`):
 * originally deferred, now ported (see MIGRATION_ROADMAP.md/MIGRATION.md for the
 * multi-select sub-project writeup) - ctrl/cmd-click toggles `selectedUss[usId]`
 * (`KanbanColumnComponent.onCardClick`), and `drop()` below builds a multi-item `usList`
 * whenever the dragged card is part of a selection of more than one card **within the same
 * source column** (mirrors the original's `isMultiple()` check, scoped to the container).
 * The original's manual DOM-cloning "N cards visually following the cursor" effect
 * (`app/js/dragula-drag-multiple.js`) is deliberately NOT reproduced - CDK's native preview
 * (a clone of the single dragged card) is used as-is, with a small "+N" badge
 * (`data-multi-count` attribute, styled in `kanban-table.scss`) instead of stacked clones -
 * a decision made explicitly with the user to avoid reintroducing the kind of manual DOM
 * hacking this whole migration is meant to eliminate. `ctrl.isMaximized`/`isMinimized`
 * (referenced in the original's `ng-class` but never defined anywhere) are dropped as dead
 * code, same as taskboard.
 *
 * **`getCardLinkParams`, `isUsInArchivedHiddenStatus`**: the former stays a callback
 * `@Input()` bound straight to `KanbanController.getCardLinkParams` (verified safe via
 * `bindMethods`/`_.bindAll` in the controller's constructor) since it's entangled with the
 * controller's own `lastLoadUserstoriesParams`/memoization cache, not a pure computation.
 * The latter just delegates to `kanbanUserstoriesService.isUsInArchivedHiddenStatus`, so
 * `KanbanColumnComponent` calls it directly via `AJS_KANBAN_USERSTORIES_SERVICE`, no
 * callback needed.
 *
 * **`moveUs`'s `previousCard`/`nextCard` order hints** (unlike taskboard's `taskMove`,
 * which only needs a raw index - a different backing service) are recomputed from
 * `event.container.data.cardIds`, the destination column's own pre-drop id list, mirroring
 * the original's DOM-based sibling lookup (`$(item).prevAll('tg-card:not(.gu-transit)')`).
 * One deliberate, minor deviation: the original computed the "no swimlanes" board's
 * `newSwimlaneId` via `Number(undefined)` (`NaN`, since there's no `data-swimlane`
 * attribute in that case) - here it's passed as `null` instead, avoiding feeding `NaN`
 * into the bulk-order API call.
 */
@Component({
    selector: "tg-kanban-sortable",
    templateUrl: "./kanban-table.component.html",
})
export class KanbanTableComponent implements OnInit, AfterViewInit, OnDestroy {
    @Input() project: any;
    @Input() projectId: any;
    @Input() zoom: any;
    @Input() zoomLevel: number;
    @Input() usStatusList: any[];
    @Input() swimlanesList: any;
    @Input() swimlanesStatuses: any;
    @Input() usByStatus: any;
    @Input() usByStatusSwimlanes: any;
    @Input() usMap: any;
    @Input() foldedSwimlane: any;
    @Input() notFoundUserstories: boolean;
    @Input() movedUs: any[] = [];
    @Input() renderInProgress: boolean;
    @Input() getCardLinkParams: (item: any) => any;
    @Input() selectedUss: Record<string, boolean> = {};

    @Output() toggleFold = new EventEmitter<{ id: any }>();
    @Output() editUs = new EventEmitter<{ id: any }>();
    @Output() deleteUs = new EventEmitter<{ id: any }>();
    @Output() changeUsAssignedUsers = new EventEmitter<{ id: any }>();
    @Output() clickMoveToTop = new EventEmitter<{ id: any }>();
    @Output() addNewUs = new EventEmitter<{ type: string; statusId: any }>();
    @Output() toggleSwimlane = new EventEmitter<{ id: any }>();
    @Output() toggleSelectedUs = new EventEmitter<{ id: any }>();
    @Output() reorder = new EventEmitter<{
        usList: Array<{ id: any }>;
        newStatusId: any;
        newSwimlaneId: any;
        index: number;
        previousCard: any;
        nextCard: any;
    }>();

    @ViewChild("kanbanTableRoot") kanbanTableRoot: ElementRef<HTMLElement>;
    @ViewChild("headerInner") headerInner: ElementRef<HTMLElement>;
    @ViewChildren("swimlaneTitle") swimlaneTitles: QueryList<ElementRef<HTMLElement>>;
    @ViewChildren("swimlaneAdd") swimlaneAdds: QueryList<ElementRef<HTMLElement>>;
    @ViewChildren("taskColumnName") taskColumnNames: QueryList<ElementRef<HTMLElement>>;

    folds: Record<string, boolean> = {};
    unfoldStatusId: any = null;
    readonly_ = false;
    sortingDisabled = true;
    isDragging = false;
    canAddUs = false;

    private hoverState: { id: any; timeoutId: any; el: HTMLElement } | null = null;
    private unwatchShown: () => void;
    private widthResizeObserver: ResizeObserver;

    constructor(
        @Inject(AJS_TG_RESOURCES) private rs: any,
        @Inject(AJS_KANBAN_USERSTORIES_SERVICE) private kanbanUserstoriesService: any,
        @Inject(AJS_ROOT_SCOPE) private rootScope: any,
        @Inject(AJS_PROJECT_SERVICE) private projectService: any,
    ) {}

    ngOnInit(): void {
        this.readonly_ = this.project.my_permissions.indexOf("modify_task") === -1;
        this.sortingDisabled = !(this.project.my_permissions.indexOf("modify_us") > -1) || !!this.project.archived_code;
        this.canAddUs = this.projectService.canEdit("add_us");

        this.folds = this.rs.kanban.getStatusColumnModes(this.projectId);

        this.usStatusList
            .filter((status: any) => status.is_archived)
            .forEach((status: any) => {
                this.folds[status.id] = true;
                this.kanbanUserstoriesService.addArchivedStatus(status.id);
                this.kanbanUserstoriesService.hideStatus(status.id);
            });

        this.unwatchShown = this.rootScope.$on(
            "kanban:shown-userstories-for-status",
            (event: any, statusId: any, userStoriesLoaded: any) => {
                this.kanbanUserstoriesService.deleteStatus(statusId);
                this.kanbanUserstoriesService.add(userStoriesLoaded);
            },
        );
    }

    ngAfterViewInit(): void {
        this.watchKanbanWidth();
    }

    ngOnDestroy(): void {
        this.unwatchShown?.();
        this.widthResizeObserver?.disconnect();

        if (this.hoverState) {
            clearTimeout(this.hoverState.timeoutId);
        }
    }

    private watchKanbanWidth(): void {
        const kanbanStyles = getComputedStyle(this.kanbanTableRoot.nativeElement);
        const columnMarginRaw = kanbanStyles.getPropertyValue("--kanban-column-margin").trim().replace("px", "").split(" ")[1];
        const columnMargin = Number(columnMarginRaw) || 0;

        this.widthResizeObserver = new ResizeObserver(() => {
            const columns = this.taskColumnNames.toArray();
            const width = columns.reduce((acc, column) => {
                if (document.body.contains(column.nativeElement)) {
                    return acc + column.nativeElement.offsetWidth + columnMargin;
                }

                return acc;
            }, 0);

            if (width > 0) {
                document.body.style.setProperty("--kanban-width", `${width - columnMargin}px`);
            }
        });

        this.taskColumnNames.forEach((column) => this.widthResizeObserver.observe(column.nativeElement));
        this.taskColumnNames.changes.subscribe((columns: QueryList<ElementRef<HTMLElement>>) => {
            this.widthResizeObserver.disconnect();
            columns.forEach((column) => this.widthResizeObserver.observe(column.nativeElement));
        });
    }

    statusesForSwimlane(swimlaneId: any): any[] {
        return this.swimlanesStatuses[swimlaneId] || [];
    }

    getCardIds(status: any, swimlaneId: any): any[] {
        if (swimlaneId != null) {
            return this.usByStatusSwimlanes.getIn([swimlaneId, status.id])?.toArray() || [];
        }

        return this.usByStatus.get(status.id.toString())?.toArray() || [];
    }

    foldStatus(status: any): void {
        this.unfoldStatusId = null;
        this.folds[status.id] = !this.folds[status.id];

        if (!this.folds[status.id]) {
            this.unfoldStatusId = status.id;
        }

        this.rs.kanban.storeStatusColumnModes(this.projectId, this.folds);

        if (
            this.kanbanUserstoriesService.archivedStatus.includes(status.id) &&
            !this.kanbanUserstoriesService.statusHide.includes(status.id)
        ) {
            this.kanbanUserstoriesService.hideStatus(status.id);
        }
    }

    showArchivedColumn(status: any): void {
        if (this.kanbanUserstoriesService.statusHide.includes(status.id)) {
            this.rootScope.$broadcast("kanban:show-userstories-for-status", status.id);
            this.kanbanUserstoriesService.showStatus(status.id);
        }
    }

    showPlaceholder(status: any, swimlaneId: any): boolean {
        const firstStatus = this.usStatusList[0].id === status.id && !this.kanbanUserstoriesService.userstoriesRaw.length;

        if (swimlaneId != null) {
            const firstSwimlane = this.swimlanesList.first().id === swimlaneId;

            return firstStatus && firstSwimlane;
        }

        return firstStatus;
    }

    isSwimlaneFolded(swimlaneId: any): boolean {
        return !!this.foldedSwimlane.get(swimlaneId.toString());
    }

    mouseleaveSwimlane(): void {
        if (this.hoverState) {
            clearTimeout(this.hoverState.timeoutId);
            this.hoverState.el.classList.remove("pending-to-open");
            this.hoverState = null;
        }
    }

    mouseoverSwimlane(event: MouseEvent, swimlaneId: any): void {
        if (this.hoverState && this.hoverState.id === swimlaneId) {
            return;
        }

        if (this.hoverState) {
            clearTimeout(this.hoverState.timeoutId);
            this.hoverState.el.classList.remove("pending-to-open");
        }

        const swimlaneEl = event.currentTarget as HTMLElement;

        if (!swimlaneEl.classList.contains("folded")) {
            return;
        }

        if (!this.isDragging) {
            return;
        }

        swimlaneEl.classList.add("pending-to-open");

        const timeoutId = setTimeout(() => {
            swimlaneEl.classList.remove("pending-to-open");
            this.toggleSwimlane.emit({ id: swimlaneId });
        }, 1000);

        this.hoverState = { id: swimlaneId, timeoutId, el: swimlaneEl };
    }

    onTableScroll(event: Event): void {
        const scroll = (event.currentTarget as HTMLElement).scrollLeft;

        this.swimlaneTitles?.forEach((el) => (el.nativeElement.style.transform = `translateX(${scroll}px)`));
        this.swimlaneAdds?.forEach((el) => (el.nativeElement.style.transform = `translateX(${scroll}px)`));
    }

    onBodyScroll(event: Event): void {
        const scroll = -1 * (event.currentTarget as HTMLElement).scrollLeft;

        if (this.headerInner) {
            this.headerInner.nativeElement.style.transform = `translateX(${scroll}px)`;
        }
    }

    drop(event: CdkDragDrop<{ statusId: any; swimlaneId: any; cardIds: any[] }>): void {
        const usId = event.item.data;
        const destIds = event.container.data.cardIds;

        let idsForPositioning = destIds;

        if (event.previousContainer === event.container) {
            idsForPositioning = [...destIds];
            idsForPositioning.splice(event.previousIndex, 1);
        }

        const previousCard = event.currentIndex > 0 ? idsForPositioning[event.currentIndex - 1] : null;
        const nextCard = !previousCard ? (idsForPositioning[event.currentIndex] ?? null) : null;

        let usList: Array<{ id: any }> = [{ id: usId }];

        if (this.selectedUss[usId]) {
            const selectedInSource = (event.previousContainer.data.cardIds || []).filter(
                (id: any) => this.selectedUss[id],
            );

            if (selectedInSource.length > 1) {
                usList = selectedInSource.map((id: any) => ({ id }));
            }
        }

        this.reorder.emit({
            usList,
            newStatusId: event.container.data.statusId,
            newSwimlaneId: event.container.data.swimlaneId,
            index: event.currentIndex,
            previousCard,
            nextCard,
        });
    }
}
