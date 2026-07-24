import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { TagLineDetailComponent } from "./tag-line-detail.component";

/**
 * Replaces the old AngularJS `tgTagLine` directive in place, under the same name, on the
 * pre-existing `taigaCommon` module.
 */
angular.module("taigaCommon").directive("tgTagLine", downgradeComponent({ component: TagLineDetailComponent }));
