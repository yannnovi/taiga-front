import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { DropdownProjectListComponent } from "./dropdown-project-list.component";

/**
 * Replaces the old AngularJS `tgDropdownProjectList` directive in place, under the same
 * name, on the pre-existing `taigaNavigationBar` module.
 */
angular
    .module("taigaNavigationBar")
    .directive("tgDropdownProjectList", downgradeComponent({ component: DropdownProjectListComponent }));
