import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { LightboxCreateBulkTasksComponent } from "./lightbox-create-bulk-tasks.component";

/**
 * Replaces the old AngularJS `tgLbCreateBulkTasks` directive in place, under the same
 * name, on the pre-existing `taigaTaskboard` module.
 */
angular
    .module("taigaTaskboard")
    .directive("tgLbCreateBulkTasks", downgradeComponent({ component: LightboxCreateBulkTasksComponent }));
