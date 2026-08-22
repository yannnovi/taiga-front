import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { AssignedUsersInlineComponent } from "./assigned-users-inline.component";

/**
 * Replaces the old AngularJS `tgAssignedUsersInline` directive in place, under the same
 * name, on the pre-existing `taigaComponents` module.
 */
angular
    .module("taigaComponents")
    .directive("tgAssignedUsersInline", downgradeComponent({ component: AssignedUsersInlineComponent }));
