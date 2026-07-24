import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { DetailNavComponent } from "./detail-nav.component";

/**
 * Replaces the old AngularJS `tgDetailNav` directive in place, under the same name, on
 * the pre-existing `taigaBase` module.
 */
angular.module("taigaBase").directive("tgDetailNav", downgradeComponent({ component: DetailNavComponent }));
