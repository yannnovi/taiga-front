import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { LightboxSearchBoxComponent } from "./lightbox-search-box.component";

/**
 * Replaces the old AngularJS `tgSearchBox` directive in place, under the same name, on
 * the pre-existing `taigaSearch` module.
 */
angular
    .module("taigaSearch")
    .directive("tgSearchBox", downgradeComponent({ component: LightboxSearchBoxComponent }));
