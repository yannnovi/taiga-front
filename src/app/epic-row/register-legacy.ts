import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { EpicRowComponent } from "./epic-row.component";

/**
 * Replaces the old AngularJS `tgEpicRow` directive in place, under the same name, on the
 * pre-existing `taigaEpics` module.
 */
angular.module("taigaEpics").directive("tgEpicRow", downgradeComponent({ component: EpicRowComponent }));
