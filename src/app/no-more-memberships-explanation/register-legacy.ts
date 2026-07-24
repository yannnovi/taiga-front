import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { NoMoreMembershipsExplanationComponent } from "./no-more-memberships-explanation.component";

/**
 * Replaces the old AngularJS `tgNoMoreMembershipsExplanation` directive in place, under
 * the same name, on the pre-existing `taigaAdmin` module.
 */
angular
    .module("taigaAdmin")
    .directive(
        "tgNoMoreMembershipsExplanation",
        downgradeComponent({ component: NoMoreMembershipsExplanationComponent }),
    );
