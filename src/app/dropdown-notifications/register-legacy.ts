import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { DropdownNotificationsComponent } from "./dropdown-notifications.component";

/**
 * Replaces the old AngularJS `tgDropdownNotifications` directive in place, under the same
 * name, on the pre-existing `taigaNavigationBar` module.
 */
angular
    .module("taigaNavigationBar")
    .directive("tgDropdownNotifications", downgradeComponent({ component: DropdownNotificationsComponent }));
