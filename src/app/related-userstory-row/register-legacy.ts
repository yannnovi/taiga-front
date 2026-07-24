import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { RelatedUserstoryRowComponent } from "./related-userstory-row.component";

/**
 * Replaces the old AngularJS `tgRelatedUserstoryRow` directive in place, under the same
 * name, on the pre-existing `taigaEpics` module.
 */
angular
    .module("taigaEpics")
    .directive("tgRelatedUserstoryRow", downgradeComponent({ component: RelatedUserstoryRowComponent }));
