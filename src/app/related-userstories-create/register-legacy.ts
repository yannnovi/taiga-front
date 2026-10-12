import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { RelatedUserstoriesCreateComponent } from "./related-userstories-create.component";

/**
 * Replaces the old AngularJS `tgRelatedUserstoriesCreate` directive in place, under the
 * same name, on the pre-existing `taigaEpics` module.
 */
angular
    .module("taigaEpics")
    .directive("tgRelatedUserstoriesCreate", downgradeComponent({ component: RelatedUserstoriesCreateComponent }));
