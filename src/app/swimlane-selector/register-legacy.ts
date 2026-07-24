import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { SwimlaneSelectorComponent } from "./swimlane-selector.component";

/**
 * Replaces the old AngularJS `tgSwimlaneSelector` directive in place, under the same
 * name, on the pre-existing `taigaComponents` module.
 */
angular
    .module("taigaComponents")
    .directive("tgSwimlaneSelector", downgradeComponent({ component: SwimlaneSelectorComponent }));
