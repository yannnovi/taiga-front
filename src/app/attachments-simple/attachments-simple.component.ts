import { Component, EventEmitter, Inject, Input, Output } from "@angular/core";
import { AJS_ATTACHMENTS_SERVICE } from "../shared/ajs-tokens";

declare const Immutable: any;

/**
 * Angular replacement for the AngularJS `tgAttachmentsSimple` directive
 * (app/modules/components/attachments-simple/), downgraded in place under the same name.
 *
 * `@Output()`s named `add`/`delete` (not `onAdd`/`onDelete`) so the existing `on-add`/
 * `on-delete` attributes on both callers keep matching - same gotcha as everywhere else.
 * The original guarded emitting with `if @.onAdd`/`if @.onDelete` since AngularJS `&`
 * bindings can be left unset - an Angular `@Output()` always exists, so `.emit()` with no
 * listener is already an equivalent no-op, no guard needed.
 *
 * `tg-attachments-drop` and `tg-file-change` (app/modules/components/attachments-drop/,
 * app/coffee/modules/common.coffee's tgFileChange) are both template-less event-wrapper
 * directives - not an UpgradeComponent fit, same family as tg-avatar/tg-loading -
 * replicated directly as native `(dragover)`/`(dragleave)`/`(drop)`/`(change)` bindings.
 */
@Component({
    selector: "tg-attachments-simple",
    templateUrl: "./attachments-simple.component.html",
})
export class AttachmentsSimpleComponent {
    @Input() attachments: any;
    @Output() add = new EventEmitter<{ attachment: any }>();
    @Output() delete = new EventEmitter<{ attachment: any }>();

    isDragOver = false;

    constructor(@Inject(AJS_ATTACHMENTS_SERVICE) private attachmentsService: any) {}

    displayAttachmentInput(): void {
        document.getElementById("add-attach")?.click();
    }

    onDragOver(event: DragEvent): void {
        event.preventDefault();
        this.isDragOver = true;
    }

    onDragLeave(event: DragEvent): void {
        event.preventDefault();
        this.isDragOver = false;
    }

    onDrop(event: DragEvent): void {
        event.preventDefault();
        this.isDragOver = false;
        this.addAttachments(event.dataTransfer?.files);
    }

    onFileInputChange(event: Event): void {
        this.addAttachments((event.target as HTMLInputElement).files);
    }

    addAttachments(files: FileList | null | undefined): void {
        if (!files) {
            return;
        }

        Array.from(files).forEach((file) => this.addAttachment(file));
    }

    addAttachment(file: File): void {
        const attachment = Immutable.fromJS({ file, name: file.name, size: file.size });

        if (this.attachmentsService.validate(file)) {
            this.attachments = this.attachments.push(attachment);
            this.add.emit({ attachment });
        }
    }

    deleteAttachment(toDeleteAttachment: any): void {
        this.attachments = this.attachments.filter((attachment: any) => attachment !== toDeleteAttachment);
        this.delete.emit({ attachment: toDeleteAttachment });
    }
}
