import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { LightboxCreateEditComponent } from "./lightbox-create-edit.component";

/**
 * Replaces the old AngularJS `tgLbCreateEdit` directive in place, under the same name, on
 * the pre-existing `taigaCommon` module.
 */
angular
    .module("taigaCommon")
    .directive("tgLbCreateEdit", downgradeComponent({ component: LightboxCreateEditComponent }));
