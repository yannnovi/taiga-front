import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { PromoteToUsButtonComponent } from "./promote-to-us.component";

/**
 * Replaces the old AngularJS `tgPromoteToUsButton` directive in place, under the same
 * name, on the pre-existing `taigaComponents` module.
 */
angular
    .module("taigaComponents")
    .directive("tgPromoteToUsButton", downgradeComponent({ component: PromoteToUsButtonComponent }));
