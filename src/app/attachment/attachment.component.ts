import { Component, OnChanges } from "@angular/core";
import { AttachmentBaseComponent } from "./attachment-base";

/**
 * Angular replacement for the AngularJS `tgAttachment` directive
 * (app/modules/components/attachment/attachment.directive.coffee), downgraded in place
 * under the same name. See `attachment-base.ts` for the shared logic notes.
 */
@Component({
    selector: "tg-attachment",
    templateUrl: "./attachment.component.html",
})
export class AttachmentComponent extends AttachmentBaseComponent implements OnChanges {}
