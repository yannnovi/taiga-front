import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { UserAvatarComponent } from "./user-avatar.component";

/**
 * Replaces the old AngularJS `tgUserAvatar` directive in place, under the same name, on
 * the pre-existing `taigaUserSettings` module.
 */
angular
    .module("taigaUserSettings")
    .directive("tgUserAvatar", downgradeComponent({ component: UserAvatarComponent }));
