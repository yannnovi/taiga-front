import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { EpicsSortableComponent } from "./epics-sortable.component";

/**
 * Replaces the old AngularJS `tgEpicsSortable` directive in place, under the same name,
 * on the pre-existing `taigaComponents` module.
 */
angular
    .module("taigaComponents")
    .directive("tgEpicsSortable", downgradeComponent({ component: EpicsSortableComponent }));
