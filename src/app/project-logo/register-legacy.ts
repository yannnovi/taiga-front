import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { ProjectLogoComponent } from "./project-logo.component";

/**
 * Replaces the old AngularJS `tgProjectLogo` directive in place, under the same
 * name, on the pre-existing `taigaAdmin` module.
 */
angular
    .module("taigaAdmin")
    .directive("tgProjectLogo", downgradeComponent({ component: ProjectLogoComponent }));
