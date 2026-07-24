import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { ProfileProjectsComponent } from "./profile-projects.component";

/**
 * Replaces the old AngularJS `tgProfileProjects` directive in place, under the same name,
 * on the pre-existing `taigaProfile` module.
 */
angular
    .module("taigaProfile")
    .directive("tgProfileProjects", downgradeComponent({ component: ProfileProjectsComponent }));
