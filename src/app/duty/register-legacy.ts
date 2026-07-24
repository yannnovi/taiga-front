import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { DutyComponent } from "./duty.component";

/**
 * Replaces the old AngularJS `tgDuty` directive in place, under the same name, on the
 * pre-existing `taigaHome` module.
 */
angular.module("taigaHome").directive("tgDuty", downgradeComponent({ component: DutyComponent }));
