import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { BlockedProjectExplanationComponent } from "./blocked-project-explanation.component";

/**
 * Replaces the old AngularJS `tgBlockedProjectExplanation` directive in place, under the
 * same name, on the pre-existing `taigaProjects` module.
 */
angular
    .module("taigaProjects")
    .directive(
        "tgBlockedProjectExplanation",
        downgradeComponent({ component: BlockedProjectExplanationComponent }),
    );
