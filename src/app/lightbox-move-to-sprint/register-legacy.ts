import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { LightboxMoveToSprintComponent } from "./lightbox-move-to-sprint.component";

/**
 * Replaces the old AngularJS `tgLbMoveToSprint` directive in place, under the same name,
 * on the pre-existing `taigaComponents` module.
 */
angular
    .module("taigaComponents")
    .directive("tgLbMoveToSprint", downgradeComponent({ component: LightboxMoveToSprintComponent }));
