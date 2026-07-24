import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { ColorSelectorComponent } from "./color-selector.component";

/**
 * Replaces the old AngularJS `tgColorSelector` directive in place, under the same name,
 * on the pre-existing `taigaComponents` module.
 */
angular
    .module("taigaComponents")
    .directive("tgColorSelector", downgradeComponent({ component: ColorSelectorComponent }));
