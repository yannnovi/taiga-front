import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { LightboxRelateToEpicComponent } from "./lightbox-relate-to-epic.component";

/**
 * Replaces the old AngularJS `tgLbRelatetoepic` directive in place, under the same name,
 * on the pre-existing `taigaCommon` module.
 */
angular
    .module("taigaCommon")
    .directive("tgLbRelatetoepic", downgradeComponent({ component: LightboxRelateToEpicComponent }));
