import { Component, EventEmitter, Inject, Input, OnChanges, Output } from "@angular/core";
import { CdkDragDrop, moveItemInArray } from "@angular/cdk/drag-drop";
import { AJS_PROJECT_SERVICE } from "../shared/ajs-tokens";

/**
 * Angular replacement for the AngularJS `tgEpicsSortable` directive
 * (app/modules/epics/dashboard/epics-sortable/), downgraded in place under the same name -
 * fourth module of the dragula -> @angular/cdk/drag-drop migration (see
 * MIGRATION_ROADMAP.md).
 *
 * The original wrapped the `.epics-table-body-row` list inside `.epics-table-body`
 * (`epics-table.jade`) - that SAME outer div also carries `infinite-scroll`
 * (`ngInfiniteScroll`, a *separate*, not-yet-addressed Phase 2 blocker - see
 * MIGRATION_ROADMAP.md item 4). Rather than touch that, this component owns only the
 * inner row list (same "internalize just the list" pattern as
 * `tgAttachmentsSortable`/`tgRelatedUserstoriesSortable`) and is nested INSIDE the
 * `.epics-table-body` div, which stays exactly as-is (still AngularJS, `infinite-scroll`
 * untouched) in the caller.
 *
 * Same permission gate as `tgRelatedUserstoriesSortable`: the original's `link` only
 * instantiated `dragula` when `projectService.hasPermission("modify_epic")`, checked once
 * (not reactively) - replicated via `[cdkDropListDisabled]`, computed once in the
 * constructor.
 *
 * Like `tgAttachmentsSortable` (and unlike `tgSortProjects`/`tgRelatedUserstoriesSortable`),
 * `epicsService.reorderEpic` already reorders its own internal Immutable List
 * synchronously before the persistence call, so `@Input() epics` (bound from that service
 * through the parent AngularJS controller) already reflects the new order on the next
 * digest - `displayEpics` is just a plain mutable copy for `@angular/cdk/drag-drop`'s
 * `moveItemInArray` to operate on, not an optimistic-update workaround.
 *
 * `tg-epic-row` (already an Angular component from an earlier batch) has no outputs to
 * bubble through.
 */
@Component({
    selector: "tg-epics-sortable",
    templateUrl: "./epics-sortable.component.html",
})
export class EpicsSortableComponent implements OnChanges {
    @Input() epics: any;
    @Input() options: any;

    @Output() reorder = new EventEmitter<{ epic: any; newIndex: number }>();

    displayEpics: any[] = [];
    sortingDisabled: boolean;

    constructor(@Inject(AJS_PROJECT_SERVICE) private projectService: any) {
        this.sortingDisabled = !this.projectService.hasPermission("modify_epic");
    }

    ngOnChanges(): void {
        this.displayEpics = this.epics ? this.epics.toArray() : [];
    }

    drop(event: CdkDragDrop<any>): void {
        const epic = this.displayEpics[event.previousIndex];

        moveItemInArray(this.displayEpics, event.previousIndex, event.currentIndex);

        this.reorder.emit({ epic, newIndex: event.currentIndex });
    }
}
