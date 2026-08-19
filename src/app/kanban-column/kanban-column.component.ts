import {
    AfterViewInit,
    Component,
    ElementRef,
    EventEmitter,
    Inject,
    Input,
    OnDestroy,
    Output,
    QueryList,
    ViewChild,
    ViewChildren,
} from "@angular/core";
import { Subscription } from "rxjs";
import { AJS_KANBAN_USERSTORIES_SERVICE } from "../shared/ajs-tokens";
import { CardComponent } from "../card/card.component";

/**
 * One status cell of the kanban board (`.kanban-uses-box.taskboard-column` in the
 * original `kanban-table.jade`) - rendered once per (status, swimlane) pair by
 * `KanbanTableComponent`. Not downgraded/exposed to AngularJS, purely an internal
 * decomposition of the migrated `tgKanbanSortable` board (see that component's doc
 * comment for the full migration writeup).
 *
 * Absorbs three of kanban's ambient per-column directives that only worked because they
 * shared the board's DOM subtree:
 * - `tgKanbanTaskboardColumn`: sticky US counter, ported as a `(scroll)` handler
 *   translating `#counter` instead of a jQuery `.css()` call.
 * - `tgKanbanWipLimit`: WIP limit banner, ported as declarative `wipLimitClass`/
 *   `wipLimitAfterIndex` getters recomputed from the same reactive `cardIds` input that
 *   already drives the card list - the original needed an imperative redraw on
 *   `redraw:wip`/`kanban:us:move`/etc. because it manipulated the DOM by hand; a plain
 *   Angular template recomputing from inputs makes that broadcast redundant here.
 * - The card lazy-render visibility tracking previously done by the global `initBoard()`
 *   utility (`app/js/boards.js`, IntersectionObserver rooted at each column) is
 *   reimplemented with a native `IntersectionObserver` rooted at this component's own
 *   host element, observing `#cardWrapper` elements via `ViewChildren` (re-subscribing on
 *   `changes` so cards added later, e.g. after scrolling a swimlane open, are tracked too)
 *   - same lazy-render behavior, standard Angular APIs instead of the legacy jQuery-ish
 *   global.
 *
 * `tgKanbanArchivedStatusIntro`'s empty `.kanban-column-intro` marker div (no visible
 * content of its own in the original template - its only job was hosting a
 * `kanban:shown-userstories-for-status` listener) is dropped; that listener is now owned
 * once, board-wide, by `KanbanTableComponent`.
 */
@Component({
    selector: "tg-kanban-column",
    templateUrl: "./kanban-column.component.html",
    host: {
        class: "kanban-uses-box taskboard-column",
        "[class.vfold]": "folded",
        "[class.vunfold]": "justUnfolded",
        "[attr.id]": "'column-' + status.id",
        "[attr.data-status]": "status.id",
        "[attr.data-swimlane]": "swimlaneId",
        "(scroll)": "onScroll($event)",
    },
})
export class KanbanColumnComponent implements AfterViewInit, OnDestroy {
    @Input() status: any;
    @Input() swimlaneId: any = null;
    @Input() cardIds: any[] = [];
    @Input() usMap: any;
    @Input() project: any;
    @Input() zoom: any;
    @Input() zoomLevel: number;
    @Input() folded: boolean;
    @Input() justUnfolded: boolean;
    @Input() showPlaceholder: boolean;
    @Input() notFoundUserstories: boolean;
    @Input() sortingDisabled: boolean;
    @Input() readonly: boolean;
    @Input() renderInProgress: boolean;
    @Input() movedUs: any[] = [];
    @Input() enableMoveToTop: boolean;
    @Input() linkParamsFn: (item: any) => any;
    @Input() selectedUss: Record<string, boolean> = {};

    @Output() toggleFold = new EventEmitter<{ id: any }>();
    @Output() editUs = new EventEmitter<{ id: any }>();
    @Output() deleteUs = new EventEmitter<{ id: any }>();
    @Output() changeUsAssignedUsers = new EventEmitter<{ id: any }>();
    @Output() clickMoveToTop = new EventEmitter<{ id: any }>();
    @Output() dragStarted = new EventEmitter<void>();
    @Output() dragEnded = new EventEmitter<void>();
    @Output() toggleSelectedUs = new EventEmitter<{ id: any }>();

    @ViewChildren(CardComponent, { read: ElementRef }) cardWrappers: QueryList<ElementRef>;
    @ViewChild("counter") counterRef: ElementRef<HTMLElement>;

    private observer: IntersectionObserver;
    private cardWrappersSub: Subscription;
    cardVisibility: Record<string, boolean> = {};

    constructor(
        @Inject(AJS_KANBAN_USERSTORIES_SERVICE) private kanbanUserstoriesService: any,
        private elementRef: ElementRef,
    ) {}

    ngAfterViewInit(): void {
        this.observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const id = (entry.target as HTMLElement).dataset["id"];

                        if (id) {
                            this.cardVisibility[id] = true;
                        }

                        this.observer.unobserve(entry.target);
                    }
                });
            },
            { root: this.elementRef.nativeElement, rootMargin: "0px", threshold: 0 },
        );

        this.observeCards();
        this.cardWrappersSub = this.cardWrappers.changes.subscribe(() => this.observeCards());
    }

    ngOnDestroy(): void {
        this.observer?.disconnect();
        this.cardWrappersSub?.unsubscribe();
    }

    private observeCards(): void {
        this.cardWrappers.forEach((wrapper) => this.observer.observe(wrapper.nativeElement));
    }

    onScroll(event: Event): void {
        const scroll = (event.currentTarget as HTMLElement).scrollTop;

        if (this.counterRef) {
            this.counterRef.nativeElement.style.transform = `translateY(${scroll}px)`;
        }
    }

    isUsInArchivedHiddenStatus(usId: any): boolean {
        return this.kanbanUserstoriesService.isUsInArchivedHiddenStatus(usId);
    }

    isMoved(usId: any): boolean {
        return this.movedUs.indexOf(usId) !== -1;
    }

    isSelected(usId: any): boolean {
        return !!this.selectedUss[usId];
    }

    get selectedCount(): number {
        return Object.keys(this.selectedUss).filter((id) => this.selectedUss[id]).length;
    }

    onCardClick(usId: any, event: MouseEvent): void {
        if (event.ctrlKey || event.metaKey) {
            this.toggleSelectedUs.emit({ id: usId });
        }
    }

    get wipLimitClass(): string {
        if (!this.status.wip_limit || this.status.is_archived) {
            return "";
        }

        const count = this.cardIds.length;

        if (count + 1 === this.status.wip_limit) {
            return "one-left";
        } else if (count === this.status.wip_limit) {
            return "reached";
        } else if (count > this.status.wip_limit) {
            return "exceeded";
        }

        return "";
    }

    /** Index (within `cardIds`) after which the WIP limit banner renders, `-1` if it
     *  shouldn't render at all - mirrors `KanbanWipLimitDirective`'s DOM-insertion-point
     *  logic (insert after the last card normally, or right after the `wip_limit`-th card
     *  once the limit is exceeded, so the banner sits between allowed and extra cards). */
    get wipLimitAfterIndex(): number {
        const wipLimit = this.status.wip_limit;

        if (!wipLimit || this.status.is_archived) {
            return -1;
        }

        const count = this.cardIds.length;

        if (count > wipLimit) {
            return wipLimit - 1;
        } else if (count === wipLimit || count + 1 === wipLimit) {
            return count - 1;
        }

        return -1;
    }
}
