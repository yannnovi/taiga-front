import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { BacklogTableComponent } from "./backlog-table.component";

/**
 * Replaces the old AngularJS `tgBacklogSortable` directive in place, under the same name,
 * on the pre-existing `taigaBacklog` module.
 */
angular
    .module("taigaBacklog")
    .directive("tgBacklogSortable", downgradeComponent({ component: BacklogTableComponent }));
