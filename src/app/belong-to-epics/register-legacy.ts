import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { BelongToEpicsComponent } from "./belong-to-epics.component";

/**
 * Replaces the old AngularJS `tgBelongToEpics` directive in place, under the same name, on
 * the pre-existing `taigaEpics` module.
 */
angular.module("taigaEpics").directive("tgBelongToEpics", downgradeComponent({ component: BelongToEpicsComponent }));
