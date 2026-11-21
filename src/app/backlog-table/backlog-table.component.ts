import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, OnDestroy, Output, ViewChild } from "@angular/core";
import { CdkDragDrop } from "@angular/cdk/drag-drop";
import { BACKLOG_DROP_LIST_ID, BacklogDropListsService } from "../backlog-sprints/backlog-drop-lists.service";

declare const $: any;

/**
 * Angular replacement for the AngularJS `tgBacklogSortable` directive
 * (app/coffee/modules/backlog/sortable.coffee), downgraded in place under the same name -
 * same "internalize the whole list" pattern as `TaskboardTableComponent`/
 * `KanbanTableComponent`, required because `cdkDropListGroup` needs every connected
 * `cdkDropList` to be an Angular-tree descendant. `backlog-table.jade` was not a directive's
 * own template - it was inline markup on the same ambient `$scope` as `BacklogController`,
 * with the actual row markup (`backlog-row.jade`) `include`d directly into it (no
 * pre-existing component boundary at all - `BacklogRowComponent` is a wholly new split, not
 * a refactor of one). `BacklogController` itself is untouched apart from the drag/status/
 * points/edit-menu directives it used to host ambiently.
 *
 * **Backlog <-> sprint drag.** The original `tgBacklogSortable` ran a SINGLE dragula
 * instance shared between the backlog table body and every `.sprint-table` in the sidebar
 * (found dynamically via an `isContainer` predicate). That was lost when this table was
 * migrated alone, and is restored now that the sidebar is `BacklogSprintsComponent`: the
 * two are sibling downgraded components with no common Angular ancestor, so instead of a
 * `cdkDropListGroup` this list and every sprint list are connected by id
 * (`BacklogDropListsService`). A drop coming from a sprint lands in `drop()` below like any
 * reorder - `ctrl.moveUs` tells the two cases apart from the user story's `milestone`.
 * Not reproduced: the two `.js-empty-backlog` placeholders that let you drop a sprint's
 * user story into an *empty* backlog (the whole table is hidden when the backlog is
 * empty).
 *
 * `ngInfiniteScroll` (`infinite-scroll="ctrl.loadUserstories()"`) is replaced by a plain
 * `IntersectionObserver` on a sentinel element after the last row - this was
 * `ngInfiniteScroll`'s only real remaining call site in the app, so this closes out that
 * roadmap item rather than leaving a single-caller third-party dependency in place.
 *
 * `ctrl.getLinkParams()` needed the same memoization fix already applied once to kanban's
 * `getCardLinkParams` (`app/coffee/modules/kanban/main.coffee`) - the original was only
 * ever read through `{{ }}` string interpolation, implicitly stable; bound directly here as
 * an object input, a freshly-built object every call would send AngularJS's digest into
 * `[$rootScope:infdig]`. Fixed at the source (`BacklogController.getLinkParams`,
 * `app/coffee/modules/backlog/main.coffee`) the same way: cached, same reference returned
 * when the computed content hasn't changed.
 */
@Component({
    selector: "tg-backlog-sortable",
    templateUrl: "./backlog-table.component.html",
})
export class BacklogTableComponent implements OnChanges, AfterViewInit, OnDestroy {
    @Input() project: any;
    @Input() userstories: any[] = [];
    @Input() visibleUserStories: any[] = [];
    @Input() showTags: boolean;
    @Input() firstUsInBacklog: any;
    @Input() disablePagination: boolean;
    @Input() firstLoadComplete: boolean;
    @Input() loadingUserstories: boolean;
    @Input() getLinkParams: () => any;

    @Output() loadMore = new EventEmitter<void>();
    @Output() editUs = new EventEmitter<any>();
    @Output() deleteUs = new EventEmitter<any>();
    @Output() moveToTop = new EventEmitter<any>();
    @Output() changeStatus = new EventEmitter<{ us: any; statusId: any }>();
    @Output() reorder = new EventEmitter<{ usList: any[]; index: number; previousUs: any; nextUs: any }>();

    @ViewChild("sentinel") sentinelRef: ElementRef<HTMLElement>;

    sortingDisabled = true;
    spinnerSrc = `${(window as any)._version}/svg/spinner-circle.svg`;
    selectedDisplayRoleId: any = null;

    readonly dropListId = BACKLOG_DROP_LIST_ID;
    readonly connectedIds: string[];

    private observer: IntersectionObserver;
    private hasSeenSentinel = false;

    constructor(dropLists: BacklogDropListsService) {
        this.connectedIds = dropLists.connectedIds;
    }

    ngOnChanges(): void {
        this.sortingDisabled = this.project.my_permissions.indexOf("modify_us") === -1 && !this.project.archived_code;
    }

    ngAfterViewInit(): void {
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting && !this.disablePagination && this.firstLoadComplete) {
                    this.loadMore.emit();
                }
            });
        });

        this.observer.observe(this.sentinelRef.nativeElement);
    }

    ngOnDestroy(): void {
        this.observer?.disconnect();
    }

    get displayedUserstories(): any[] {
        return this.userstories.filter((us) => this.visibleUserStories.includes(us.ref));
    }

    get linkParams(): any {
        return this.getLinkParams ? this.getLinkParams() : {};
    }

    get hasMultipleRoles(): boolean {
        return (this.project.roles || []).filter((r: any) => r.computable).length > 1;
    }

    openRoleFilterPopover(event: MouseEvent): void {
        $((event.currentTarget as HTMLElement).closest(".inner")).find(".pop-role").popover().open();
    }

    selectRoleFilter(roleId: any, event: MouseEvent): void {
        $((event.currentTarget as HTMLElement).closest(".inner")).find(".pop-role").popover().close();
        this.selectedDisplayRoleId = roleId;
    }

    drop(event: CdkDragDrop<{ items: any[] }>): void {
        const us = event.item.data;
        const idsForPositioning = [...event.container.data.items];
        const draggedIndex = idsForPositioning.indexOf(us);

        if (draggedIndex !== -1) {
            idsForPositioning.splice(draggedIndex, 1);
        }

        const previousUs = event.currentIndex > 0 ? idsForPositioning[event.currentIndex - 1]?.id ?? null : null;
        const nextUs = !previousUs ? idsForPositioning[event.currentIndex]?.id ?? null : null;

        this.reorder.emit({ usList: this.buildDropUsList(us, event), index: event.currentIndex, previousUs, nextUs });
    }

    /** Backlog's multi-select has no Angular-side state at all (`checkSelected` in
     *  `BacklogController`'s `linkToolbar` only ever toggles DOM classes) - the only way to
     *  know which rows are checked at drop time is to ask the DOM, mirroring what the
     *  original `dragula-drag-multiple.js` itself did (`$(container).find('.' +
     *  multipleSortableClass)`). */
    private buildDropUsList(draggedUs: any, event: CdkDragDrop<{ items: any[] }>): any[] {
        const draggedEl = event.item.element.nativeElement as HTMLElement;

        if (!draggedEl.classList.contains("ui-multisortable-multiple")) {
            return [draggedUs];
        }

        const selectedIds = Array.from(
            draggedEl.closest(".backlog-table-body")?.querySelectorAll(".ui-multisortable-multiple") ?? [],
        ).map((el) => Number((el as HTMLElement).dataset["id"]));

        if (selectedIds.length <= 1) {
            return [draggedUs];
        }

        const selectedUsList = this.userstories.filter((it) => selectedIds.includes(it.id));

        return selectedUsList.length > 1 ? selectedUsList : [draggedUs];
    }
}
