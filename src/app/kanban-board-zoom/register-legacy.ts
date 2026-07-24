import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { KanbanBoardZoomComponent } from "./kanban-board-zoom.component";

/**
 * Replaces the old AngularJS `tgKanbanBoardZoom` directive in place, under the same name,
 * on the pre-existing `taigaComponents` module.
 */
angular
    .module("taigaComponents")
    .directive("tgKanbanBoardZoom", downgradeComponent({ component: KanbanBoardZoomComponent }));
