import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { InviteMembersFormComponent } from "./invite-members-form.component";

/**
 * Replaces the old AngularJS `tgInviteMembersForm` directive in place, under the same
 * name, on the pre-existing `taigaAdmin` module.
 */
angular
    .module("taigaAdmin")
    .directive("tgInviteMembersForm", downgradeComponent({ component: InviteMembersFormComponent }));
