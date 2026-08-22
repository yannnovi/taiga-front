import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { CustomAttributeValueComponent } from "./custom-attribute-value.component";

/**
 * Replaces the old AngularJS `tgCustomAttributeValue` directive in place, under the same
 * name, on the pre-existing `taigaCommon` module.
 */
angular
    .module("taigaCommon")
    .directive("tgCustomAttributeValue", downgradeComponent({ component: CustomAttributeValueComponent }));
