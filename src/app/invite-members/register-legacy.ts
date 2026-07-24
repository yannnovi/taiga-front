import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { InviteMembersComponent } from "./invite-members.component";

/**
 * Replaces the old AngularJS `tgInviteMembers` directive in place, under the same name, on
 * the pre-existing `taigaProjects` module.
 */
angular.module("taigaProjects").directive("tgInviteMembers", downgradeComponent({ component: InviteMembersComponent }));
