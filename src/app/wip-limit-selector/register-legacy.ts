import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { WipLimitSelectorComponent } from "./wip-limit-selector.component";

/**
 * Replaces the old AngularJS `tgWipLimitSelector` directive in place, under the same
 * name, on the pre-existing `taigaComponents` module.
 */
angular
    .module("taigaComponents")
    .directive("tgWipLimitSelector", downgradeComponent({ component: WipLimitSelectorComponent }));
