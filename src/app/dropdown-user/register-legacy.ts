import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { DropdownUserComponent } from "./dropdown-user.component";

/**
 * Replaces the old AngularJS `tgDropdownUser` directive in place, under the same name, on
 * the pre-existing `taigaNavigationBar` module.
 */
angular
    .module("taigaNavigationBar")
    .directive("tgDropdownUser", downgradeComponent({ component: DropdownUserComponent }));
