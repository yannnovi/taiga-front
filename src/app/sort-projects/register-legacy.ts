import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { SortProjectsComponent } from "./sort-projects.component";

/**
 * Replaces the old AngularJS `tgSortProjects` directive in place, under the same name,
 * on the pre-existing `taigaProjects` module.
 */
angular
    .module("taigaProjects")
    .directive("tgSortProjects", downgradeComponent({ component: SortProjectsComponent }));
