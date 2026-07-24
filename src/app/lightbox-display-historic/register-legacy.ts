import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { LightboxDisplayHistoricComponent } from "./lightbox-display-historic.component";

/**
 * Replaces the old AngularJS `tgLbDisplayHistoric` directive in place, under the same
 * name, on the pre-existing `taigaHistory` module.
 */
angular
    .module("taigaHistory")
    .directive("tgLbDisplayHistoric", downgradeComponent({ component: LightboxDisplayHistoricComponent }));
