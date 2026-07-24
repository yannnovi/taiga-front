import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { ProfileContactsComponent } from "./profile-contacts.component";

/**
 * Replaces the old AngularJS `tgProfileContacts` directive in place, under the same name,
 * on the pre-existing `taigaProfile` module.
 */
angular
    .module("taigaProfile")
    .directive("tgProfileContacts", downgradeComponent({ component: ProfileContactsComponent }));
