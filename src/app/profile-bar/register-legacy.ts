import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { ProfileBarComponent } from "./profile-bar.component";

/**
 * Replaces the old AngularJS `tgProfileBar` directive in place, under the same name, on
 * the pre-existing `taigaProfile` module.
 */
angular.module("taigaProfile").directive("tgProfileBar", downgradeComponent({ component: ProfileBarComponent }));
