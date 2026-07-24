import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { AttachmentsPreviewComponent } from "./attachments-preview.component";

/**
 * Replaces the old AngularJS `tgAttachmentsPreview` directive in place, under the same
 * name, on the pre-existing `taigaComponents` module.
 */
angular
    .module("taigaComponents")
    .directive("tgAttachmentsPreview", downgradeComponent({ component: AttachmentsPreviewComponent }));
