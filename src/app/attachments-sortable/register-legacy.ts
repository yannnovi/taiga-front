import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { AttachmentsSortableComponent } from "./attachments-sortable.component";

/**
 * Replaces the old AngularJS `tgAttachmentsSortable` directive in place, under the same
 * name, on the pre-existing `taigaComponents` module.
 */
angular
    .module("taigaComponents")
    .directive("tgAttachmentsSortable", downgradeComponent({ component: AttachmentsSortableComponent }));
