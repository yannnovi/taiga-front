import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { CreateEpicComponent } from "./create-epic.component";

/**
 * Replaces the old AngularJS `tgCreateEpic` directive in place, under the same name, on
 * the pre-existing `taigaEpics` module.
 */
angular.module("taigaEpics").directive("tgCreateEpic", downgradeComponent({ component: CreateEpicComponent }));
