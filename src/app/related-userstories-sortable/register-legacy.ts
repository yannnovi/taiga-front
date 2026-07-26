import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { RelatedUserstoriesSortableComponent } from "./related-userstories-sortable.component";

/**
 * Replaces the old AngularJS `tgRelatedUserstoriesSortable` directive in place, under the
 * same name, on the pre-existing `taigaEpics` module.
 */
angular
    .module("taigaEpics")
    .directive("tgRelatedUserstoriesSortable", downgradeComponent({ component: RelatedUserstoriesSortableComponent }));
