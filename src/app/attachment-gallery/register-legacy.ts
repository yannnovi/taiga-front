import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { AttachmentGalleryComponent } from "./attachment-gallery.component";

/**
 * Replaces the old AngularJS `tgAttachmentGallery` directive in place, under the same
 * name, on the pre-existing `taigaComponents` module.
 */
angular
    .module("taigaComponents")
    .directive("tgAttachmentGallery", downgradeComponent({ component: AttachmentGalleryComponent }));
