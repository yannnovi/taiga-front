import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { TagComponent } from "./tag.component";

/**
 * Replaces the old AngularJS `tgTag` directive in place, under the same name, on the
 * pre-existing `taigaCommon` module.
 */
angular.module("taigaCommon").directive("tgTag", downgradeComponent({ component: TagComponent }));
