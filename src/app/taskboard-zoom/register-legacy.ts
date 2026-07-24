import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { TaskboardZoomComponent } from "./taskboard-zoom.component";

/**
 * Replaces the old AngularJS `tgTaskboardZoom` directive in place, under the same name,
 * on the pre-existing `taigaComponents` module.
 */
angular
    .module("taigaComponents")
    .directive("tgTaskboardZoom", downgradeComponent({ component: TaskboardZoomComponent }));
