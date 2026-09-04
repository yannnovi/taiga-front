import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { UserProfileFormComponent } from "./user-profile-form.component";

/**
 * Registers the user profile form on the pre-existing `taigaUserSettings` module,
 * replacing the AngularJS `tgUserProfile` directive's form content and submit behaviour
 * (app/coffee/modules/user-settings/main.coffee).
 */
angular
    .module("taigaUserSettings")
    .directive("tgUserProfileForm", downgradeComponent({ component: UserProfileFormComponent }));
