import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { InputSearchComponent } from "./input-search.component";

/**
 * Replaces the old AngularJS `tgInputSearch` component in place, under the same name, on
 * the pre-existing `taigaComponents` module.
 */
angular
    .module("taigaComponents")
    .directive("tgInputSearch", downgradeComponent({ component: InputSearchComponent }));
