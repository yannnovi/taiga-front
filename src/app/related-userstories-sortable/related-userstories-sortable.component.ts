import { Component, Inject, Input, OnChanges, Output, EventEmitter } from "@angular/core";
import { CdkDragDrop, moveItemInArray } from "@angular/cdk/drag-drop";
import { AJS_PROJECT_SERVICE } from "../shared/ajs-tokens";

/**
 * Angular replacement for the AngularJS `tgRelatedUserstoriesSortable` directive
 * (app/modules/epics/related-userstories/related-userstories-sortable/), downgraded in
 * place under the same name - third module of the dragula -> @angular/cdk/drag-drop
 * migration (see MIGRATION_ROADMAP.md).
 *
 * Same situation as `tgSortProjects`/`tgAttachmentsSortable`: the original was an
 * ambient-scope attribute directive wrapping the `.related-userstories-body` section of
 * `related-userstories.jade` (owned by `tgRelatedUserstories`, whose OWN scope is
 * actually isolate and clean - it's only blocked from full migration by its
 * `tg-related-userstories-create` child, still AngularJS and not audited here) rather
 * than owning it - migrated by internalizing just that body section (the sortable list
 * of `tg-related-userstory-row`, already an Angular component from an earlier batch)
 * into this component, leaving the rest of `related-userstories.jade` untouched.
 *
 * The original's `link` gated the whole `dragula(...)` instantiation on
 * `projectService.hasPermission("modify_epic")`, checked once at link time (not
 * reactively watched) - replicated the same way via `[cdkDropListDisabled]`, computed
 * once in the constructor. This is a *different* check from `userCanSort` (bound from
 * the caller's `vm.userCanSort()`, itself `projectService.canEdit("modify_epic")`), which
 * only drove the `sortable` CSS class in the original - kept as two distinct checks here
 * too, faithful to the original rather than assuming they're interchangeable.
 *
 * Like `tgSortProjects` (and unlike `tgAttachmentsSortable`), `epicsService.reorderRelatedUserstory`
 * does not reorder its own data before the persistence call - it recomputes order data,
 * calls the API, then on success re-fetches the full list. So `displayUserstories` (a
 * local mutable copy) is reordered immediately in `drop()` for the same optimistic visual
 * feedback `dragula` gave for free, corrected once the parent's `@Input() userstories`
 * next updates from the server.
 */
@Component({
    selector: "tg-related-userstories-sortable",
    templateUrl: "./related-userstories-sortable.component.html",
})
export class RelatedUserstoriesSortableComponent implements OnChanges {
    @Input() userstories: any;
    @Input() epic: any;
    @Input() project: any;
    @Input() userCanSort = false;

    @Output() reorder = new EventEmitter<{ us: any; newIndex: number }>();
    @Output() loadRelatedUserstories = new EventEmitter<void>();

    displayUserstories: any[] = [];
    sortingDisabled: boolean;

    constructor(@Inject(AJS_PROJECT_SERVICE) private projectService: any) {
        this.sortingDisabled = !this.projectService.hasPermission("modify_epic");
    }

    ngOnChanges(): void {
        this.displayUserstories = this.userstories ? this.userstories.toArray() : [];
    }

    drop(event: CdkDragDrop<any>): void {
        const us = this.displayUserstories[event.previousIndex];

        moveItemInArray(this.displayUserstories, event.previousIndex, event.currentIndex);

        this.reorder.emit({ us, newIndex: event.currentIndex });
    }
}
