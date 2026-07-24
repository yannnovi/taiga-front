import { Component, HostListener, Inject, Input } from "@angular/core";
import { AJS_ATTACHMENTS_PREVIEW_SERVICE } from "../shared/ajs-tokens";

declare const taiga: any;
declare const window: any;

/**
 * Angular replacement for the AngularJS `tgAttachmentsPreview` directive
 * (app/modules/components/attachments-preview/), downgraded in place under the same name -
 * the fullscreen image-preview lightbox opened by `tg-attachment-link`/`tg-attachment-gallery-link`
 * (both already inlined into `attachment`/`attachment-gallery` earlier in this migration).
 *
 * The original attached its left/right arrow keydown listener on `document.body` directly
 * (not scoped to its own element, since the lightbox can be focused elsewhere) -
 * replicated via `@HostListener("document:keydown", ...)`. `tg-preload-image`
 * (transclude-based, shows a spinner until the image loads) replicated with a plain
 * `loading` flag toggled by the native `<img>` `(load)` event instead of a manual
 * `Image()` preload object - same declarative-Angular-instead-of-raw-DOM approach used for
 * `tg-loading` elsewhere in this migration.
 */
@Component({
    selector: "tg-attachments-preview",
    templateUrl: "./attachments-preview.component.html",
})
export class AttachmentsPreviewComponent {
    @Input() attachments: any;

    loading = true;
    spinnerSrc = `${window._version}/svg/spinner-circle.svg`;

    constructor(@Inject(AJS_ATTACHMENTS_PREVIEW_SERVICE) private attachmentsPreviewService: any) {}

    get current(): any {
        if (!this.attachmentsPreviewService.fileId) {
            return null;
        }

        return this.getCurrent();
    }

    @HostListener("document:keydown", ["$event"])
    onKeydown(event: KeyboardEvent): void {
        if (!this.attachmentsPreviewService.fileId) {
            return;
        }

        if (event.keyCode === 39) {
            this.next();
        } else if (event.keyCode === 37) {
            this.previous();
        }
    }

    onImageLoad(): void {
        this.loading = false;
    }

    onSrcChange(): void {
        this.loading = true;
    }

    hasPagination(): boolean {
        const images = this.attachments.filter((attachment: any) => taiga.isImage(attachment.getIn(["file", "name"])));

        return images.size > 1;
    }

    getCurrent(): any {
        const attachment = this.attachments.find(
            (a: any) => this.attachmentsPreviewService.fileId === a.getIn(["file", "id"]),
        );

        return attachment ? attachment.get("file") : null;
    }

    private getIndex(): number {
        return this.attachments.findIndex(
            (a: any) => this.attachmentsPreviewService.fileId === a.getIn(["file", "id"]),
        );
    }

    next(): void {
        const attachmentIndex = this.getIndex();

        let image = this.attachments
            .slice(attachmentIndex + 1)
            .find((a: any) => taiga.isImage(a.getIn(["file", "name"])));

        if (!image) {
            image = this.attachments.find((a: any) => taiga.isImage(a.getIn(["file", "name"])));
        }

        this.attachmentsPreviewService.fileId = image.getIn(["file", "id"]);
        this.onSrcChange();
    }

    previous(): void {
        const attachmentIndex = this.getIndex();

        let image = this.attachments.slice(0, attachmentIndex).findLast((a: any) => taiga.isImage(a.getIn(["file", "name"])));

        if (!image) {
            image = this.attachments.findLast((a: any) => taiga.isImage(a.getIn(["file", "name"])));
        }

        this.attachmentsPreviewService.fileId = image.getIn(["file", "id"]);
        this.onSrcChange();
    }
}
