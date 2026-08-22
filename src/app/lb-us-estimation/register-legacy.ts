import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { LbUsEstimationComponent } from "./lb-us-estimation.component";

/**
 * Replaces the old AngularJS `tgLbUsEstimation` directive in place, under the same name,
 * on the pre-existing `taigaCommon` module.
 */
angular
    .module("taigaCommon")
    .directive("tgLbUsEstimation", downgradeComponent({ component: LbUsEstimationComponent }));
