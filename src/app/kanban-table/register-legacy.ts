import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { KanbanTableComponent } from "./kanban-table.component";

/**
 * Replaces the old AngularJS `tgKanbanSortable` directive in place, under the same name,
 * on the pre-existing `taigaKanban` module (the original directive's own module).
 */
angular
    .module("taigaKanban")
    .directive("tgKanbanSortable", downgradeComponent({ component: KanbanTableComponent }));
