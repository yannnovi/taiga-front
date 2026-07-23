import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { ProfileHintsComponent } from "./profile-hints.component";

/**
 * Replaces the old AngularJS `tgProfileHints` directive
 * (app/modules/profile/profile-hints/) in place, under the same name, on the
 * pre-existing `taigaProfile` module.
 */
angular
    .module("taigaProfile")
    .directive("tgProfileHints", downgradeComponent({ component: ProfileHintsComponent }));
