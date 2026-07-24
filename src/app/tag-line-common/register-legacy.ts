import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { TagLineCommonComponent } from "./tag-line-common.component";

/**
 * Replaces the old AngularJS `tgTagLineCommon` directive in place, under the same name, on
 * the pre-existing `taigaCommon` module.
 */
angular
    .module("taigaCommon")
    .directive("tgTagLineCommon", downgradeComponent({ component: TagLineCommonComponent }));
