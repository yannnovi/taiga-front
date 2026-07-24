import { Directive, ElementRef, EventEmitter, Inject, Input, Output, ViewChild } from "@angular/core";
import {
    AJS_ATTACHMENTS_PREVIEW_SERVICE,
    AJS_ATTACHMENTS_SERVICE,
    AJS_LIGHTBOX_SERVICE,
    AJS_PROJECT_SERVICE,
    AJS_TRANSLATE,
} from "../shared/ajs-tokens";

declare const $: any;
declare const moment: any;
declare const taiga: any;
declare const window: any;

/**
 * Shared base for `AttachmentComponent`/`AttachmentGalleryComponent` - both downgrade a
 * separate AngularJS directive (`tgAttachment`/`tgAttachmentGallery`) that shared a single
 * AngularJS controller (`AttachmentController`) across two different templates. Kept as
 * one base class here instead of duplicating the (small but non-trivial) logic twice.
 *
 * `tg-check-permission="modify_{{vm.type}}"` (app/coffee/modules/common.coffee, a
 * template-less directive) replicated inline via `tgProjectService.canEdit(...)`, same
 * pattern as promote-to-us. `tg-attachment-link` (app/modules/components/attachment-link/,
 * also template-less) replicated inline via `onAttachmentLinkClick`.
 */
@Directive()
export abstract class AttachmentBaseComponent {
    @Input() attachment: any;
    @Input() type: any;
    @Output() delete = new EventEmitter<{ attachment: any }>();
    @Output() update = new EventEmitter<{ attachment: any }>();

    @ViewChild("autoSelectInput") autoSelectInputRef: ElementRef<HTMLInputElement> | undefined;

    form: { description: any; is_deprecated: any } = { description: undefined, is_deprecated: undefined };
    title = "";
    spinnerSrc = `${window._version}/svg/spinner-circle.svg`;
    fallbackImageSrc = `${window._version}/images/attachment-gallery.png`;

    constructor(
        @Inject(AJS_ATTACHMENTS_SERVICE) protected attachmentsService: any,
        @Inject(AJS_TRANSLATE) protected translate: any,
        @Inject(AJS_PROJECT_SERVICE) protected projectService: any,
        @Inject(AJS_ATTACHMENTS_PREVIEW_SERVICE) protected attachmentsPreviewService: any,
        @Inject(AJS_LIGHTBOX_SERVICE) protected lightboxService: any,
    ) {}

    ngOnChanges(): void {
        if (!this.attachment) {
            return;
        }

        this.form = {
            description: this.attachment.getIn(["file", "description"]),
            is_deprecated: this.attachment.get(["file", "is_deprecated"]),
        };

        this.title = this.translate.instant("ATTACHMENT.TITLE", {
            fileName: this.attachment.get("name"),
            date: moment(this.attachment.get("created_date")).format(this.translate.instant("ATTACHMENT.DATE")),
        });
    }

    canEditAttachment(): boolean {
        return this.projectService.project && this.projectService.canEdit(`modify_${this.type}`);
    }

    editMode(mode: boolean): void {
        this.attachment = this.attachment.set("editable", mode);
        this.update.emit({ attachment: this.attachment });

        if (mode) {
            setTimeout(() => this.autoSelectInputRef?.nativeElement.select());
        }
    }

    deleteAttachment(): void {
        this.delete.emit({ attachment: this.attachment });
    }

    save(): void {
        let attachment = this.attachment.set("loading", true);

        this.update.emit({ attachment });

        attachment = attachment.merge({ editable: false, loading: false });
        attachment = attachment.mergeIn(["file"], {
            description: this.form.description,
            is_deprecated: !!this.form.is_deprecated,
        });

        this.update.emit({ attachment });
    }

    onAttachmentLinkClick(event: MouseEvent): void {
        const fileName = this.attachment.getIn(["file", "name"]);

        if (taiga.isImage(fileName)) {
            event.preventDefault();
            this.lightboxService.open($("tg-attachments-preview"));
            this.attachmentsPreviewService.fileId = this.attachment.getIn(["file", "id"]);
        } else if (taiga.isPdf(fileName)) {
            event.preventDefault();
            window.open(this.attachment.getIn(["file", "url"]));
        }
    }
}
