import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { SuggestAddMembersComponent } from "./suggest-add-members.component";

/**
 * Replaces the old AngularJS `tgSuggestAddMembers` directive in place, under the same
 * name, on the pre-existing `taigaAdmin` module.
 */
angular
    .module("taigaAdmin")
    .directive("tgSuggestAddMembers", downgradeComponent({ component: SuggestAddMembersComponent }));
