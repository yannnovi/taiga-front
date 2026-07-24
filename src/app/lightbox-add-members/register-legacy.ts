import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { LightboxAddMembersComponent } from "./lightbox-add-members.component";

/**
 * Replaces the old AngularJS `tgLbAddMembers` directive in place, under the same name, on
 * the pre-existing `taigaAdmin` module.
 */
angular
    .module("taigaAdmin")
    .directive("tgLbAddMembers", downgradeComponent({ component: LightboxAddMembersComponent }));
