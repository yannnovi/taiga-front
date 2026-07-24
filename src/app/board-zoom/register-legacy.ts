import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { BoardZoomComponent } from "./board-zoom.component";

/**
 * Replaces the old AngularJS `tgBoardZoom` directive in place, under the same name, on
 * the pre-existing `taigaComponents` module.
 */
angular
    .module("taigaComponents")
    .directive("tgBoardZoom", downgradeComponent({ component: BoardZoomComponent }));
