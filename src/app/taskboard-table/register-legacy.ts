import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { TaskboardTableComponent } from "./taskboard-table.component";

/**
 * Replaces the old AngularJS `tgTaskboardSortable` directive in place, under the same
 * name, on the pre-existing `taigaBacklog` module (the original directive's own module,
 * despite being taskboard-specific).
 */
angular
    .module("taigaBacklog")
    .directive("tgTaskboardSortable", downgradeComponent({ component: TaskboardTableComponent }));
