import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { AttachmentsSimpleComponent } from "./attachments-simple.component";

/**
 * Replaces the old AngularJS `tgAttachmentsSimple` directive in place, under the same
 * name, on the pre-existing `taigaComponents` module.
 */
angular
    .module("taigaComponents")
    .directive("tgAttachmentsSimple", downgradeComponent({ component: AttachmentsSimpleComponent }));
