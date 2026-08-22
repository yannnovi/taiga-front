import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { CustomAttributesValuesComponent } from "./custom-attributes-values.component";

/**
 * Replaces the old AngularJS `tgCustomAttributesValues` directive in place, under the same
 * name, on the pre-existing `taigaCommon` module.
 */
angular
    .module("taigaCommon")
    .directive("tgCustomAttributesValues", downgradeComponent({ component: CustomAttributesValuesComponent }));
