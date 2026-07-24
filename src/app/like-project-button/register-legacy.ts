import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { LikeProjectButtonComponent } from "./like-project-button.component";

/**
 * Replaces the old AngularJS `tgLikeProjectButton` directive in place, under the same
 * name, on the pre-existing `taigaProjects` module.
 */
angular
    .module("taigaProjects")
    .directive("tgLikeProjectButton", downgradeComponent({ component: LikeProjectButtonComponent }));
