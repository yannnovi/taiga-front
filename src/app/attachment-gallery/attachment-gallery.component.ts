import { Component, OnChanges } from "@angular/core";
import { AttachmentBaseComponent } from "../attachment/attachment-base";

/**
 * Angular replacement for the AngularJS `tgAttachmentGallery` directive
 * (app/modules/components/attachment/attachment-gallery.directive.coffee), downgraded in
 * place under the same name. See `attachment/attachment-base.ts` for the shared logic
 * notes - this and `tg-attachment` shared a single AngularJS controller.
 */
@Component({
    selector: "tg-attachment-gallery",
    templateUrl: "./attachment-gallery.component.html",
})
export class AttachmentGalleryComponent extends AttachmentBaseComponent implements OnChanges {}
