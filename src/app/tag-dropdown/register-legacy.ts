import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { TagDropdownComponent } from "./tag-dropdown.component";

/**
 * Replaces the old AngularJS `tgTagsDropdown` directive in place, under the same name, on
 * the pre-existing `taigaCommon` module.
 */
angular.module("taigaCommon").directive("tgTagsDropdown", downgradeComponent({ component: TagDropdownComponent }));
