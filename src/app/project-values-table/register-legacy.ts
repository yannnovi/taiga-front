import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { ProjectValuesSimpleComponent } from "./project-values-simple.component";
import { ProjectValuesStatusComponent } from "./project-values-status.component";
import { ProjectValuesUsStatusComponent } from "./project-values-us-status.component";
import { ProjectValuesPointsComponent } from "./project-values-points.component";
import { ProjectValuesDueDatesComponent } from "./project-values-due-dates.component";

/**
 * Registers the project-values table variants on the pre-existing `taigaAdmin` module -
 * new selectors, not a replacement of `tgProjectValues`/`tgProjectDueDatesValues` under
 * their own names, since each variant now maps 1:1 to a specific jade template rather than
 * one directive rendering whichever template its caller happened to `include`.
 */
angular
    .module("taigaAdmin")
    .directive("tgProjectValuesSimple", downgradeComponent({ component: ProjectValuesSimpleComponent }))
    .directive("tgProjectValuesStatus", downgradeComponent({ component: ProjectValuesStatusComponent }))
    .directive("tgProjectValuesUsStatus", downgradeComponent({ component: ProjectValuesUsStatusComponent }))
    .directive("tgProjectValuesPoints", downgradeComponent({ component: ProjectValuesPointsComponent }))
    .directive("tgProjectValuesDueDates", downgradeComponent({ component: ProjectValuesDueDatesComponent }));
