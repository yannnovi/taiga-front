import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { CantOwnProjectExplanationComponent } from "./cant-own-project-explanation.component";

/**
 * Replaces the old AngularJS `tgCantOwnProjectExplanation` directive in place, under the
 * same name, on the pre-existing `taigaProjects` module.
 */
angular
    .module("taigaProjects")
    .directive(
        "tgCantOwnProjectExplanation",
        downgradeComponent({ component: CantOwnProjectExplanationComponent }),
    );
