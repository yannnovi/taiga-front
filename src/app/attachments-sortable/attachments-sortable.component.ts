import { Component, EventEmitter, Input, OnChanges, Output } from "@angular/core";
import { CdkDragDrop, moveItemInArray } from "@angular/cdk/drag-drop";

/**
 * Angular replacement for the AngularJS `tgAttachmentsSortable` directive
 * (app/modules/components/attachments-sortable/), downgraded in place under the same
 * name - second module of the dragula -> @angular/cdk/drag-drop migration (see
 * MIGRATION_ROADMAP.md). Same situation as `tgSortProjects`: the original was an
 * attribute-only directive wrapping an *existing* list (the `.attachment-list.sortable`
 * section of `attachments-full.jade`, itself owned by the still-AngularJS
 * `tgAttachmentsFull`) rather than owning it - porting it to CDK meant internalizing that
 * whole section (the sortable `tg-attachment` list, the non-draggable uploading-file
 * placeholders, and the "show/hide deprecated" toggle link that lives right below it in
 * the same DOM block) into this component's own template, rather than downgrading CDK's
 * own directives into an AngularJS template.
 *
 * Unlike `tgSortProjects` (whose `bulkUpdateProjectsOrder` triggers a full server refetch),
 * `tgAttachmentsFullService.reorderAttachment` already reorders its own internal Immutable
 * List synchronously *before* firing the persistence call - so the `attachmentsVisible`
 * @Input(), bound straight from that service through the parent AngularJS controller,
 * already reflects the new order on next digest. No local optimistic copy is needed here
 * the way `displayProjects` was for `tgSortProjects`.
 *
 * `tg-attachment`'s `delete`/`update` outputs are re-emitted upward as-is (same event
 * shape, `{attachment}`), since the parent controller's `deleteAttachment`/
 * `updateAttachment` methods still live on the AngularJS side.
 *
 * The `title` on `.more-attachments` is always "ATTACHMENT.SHOW_DEPRECATED" in the
 * original, even once toggled to the "hide" state (only the visible span text changes) -
 * kept exactly as-is, not "fixed", faithful to the original's (probably unintentional)
 * behavior.
 */
@Component({
    selector: "tg-attachments-sortable",
    templateUrl: "./attachments-sortable.component.html",
})
export class AttachmentsSortableComponent implements OnChanges {
    @Input() attachmentsVisible: any;
    @Input() uploadingAttachments: any[] = [];
    @Input() type: string;
    @Input() deprecatedsCount = 0;
    @Input() deprecatedsVisible = false;

    @Output() reorder = new EventEmitter<{ attachment: any; index: number }>();
    @Output() delete = new EventEmitter<{ attachment: any }>();
    @Output() update = new EventEmitter<{ attachment: any }>();
    @Output() toggleDeprecatedsVisible = new EventEmitter<void>();

    displayAttachments: any[] = [];

    ngOnChanges(): void {
        this.displayAttachments = this.attachmentsVisible ? this.attachmentsVisible.toArray() : [];
    }

    drop(event: CdkDragDrop<any>): void {
        const attachment = this.displayAttachments[event.previousIndex];

        moveItemInArray(this.displayAttachments, event.previousIndex, event.currentIndex);

        this.reorder.emit({ attachment, index: event.currentIndex });
    }
}
