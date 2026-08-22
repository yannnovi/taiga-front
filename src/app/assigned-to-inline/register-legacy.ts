import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { AssignedToInlineComponent } from "./assigned-to-inline.component";

/**
 * Replaces the old AngularJS `tgAssignedToInline` directive in place, under the same name,
 * on the pre-existing `taigaComponents` module.
 */
angular
    .module("taigaComponents")
    .directive("tgAssignedToInline", downgradeComponent({ component: AssignedToInlineComponent }));
