import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { MoveToSprintComponent } from "./move-to-sprint.component";

/**
 * Replaces the old AngularJS `tgMoveToSprint` directive in place, under the same name, on
 * the pre-existing `taigaComponents` module.
 */
angular
    .module("taigaComponents")
    .directive("tgMoveToSprint", downgradeComponent({ component: MoveToSprintComponent }));
