import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import {
    DetailBlockButtonComponent,
    DetailCreatedByComponent,
    DetailDeleteButtonComponent,
    DetailIocaineButtonComponent,
    DetailRequirementButtonComponent,
    DetailStatusButtonComponent,
    DetailStatusDisplayComponent,
    LightboxBlockComponent,
} from "./detail-buttons.components";

/**
 * Detail page sidebar widgets (epic / user story / task / issue). Replace
 * tg{Epic,Us,Task,Issue}StatusDisplay, tg{Epic,Us,Task,Issue}StatusButton,
 * tgUs{Team,Client}RequirementButton, tgTaskIsIocaineButton, tgBlockButton,
 * tgDeleteButton, tgCreatedByDisplay and tgLbBlock (same name, now an element).
 */
angular
    .module("taigaCommon")
    .directive("tgDetailStatusDisplay", downgradeComponent({ component: DetailStatusDisplayComponent }))
    .directive("tgDetailStatusButton", downgradeComponent({ component: DetailStatusButtonComponent }))
    .directive("tgDetailRequirementButton", downgradeComponent({ component: DetailRequirementButtonComponent }))
    .directive("tgDetailIocaineButton", downgradeComponent({ component: DetailIocaineButtonComponent }))
    .directive("tgDetailBlockButton", downgradeComponent({ component: DetailBlockButtonComponent }))
    .directive("tgDetailDeleteButton", downgradeComponent({ component: DetailDeleteButtonComponent }))
    .directive("tgDetailCreatedBy", downgradeComponent({ component: DetailCreatedByComponent }))
    .directive("tgLbBlock", downgradeComponent({ component: LightboxBlockComponent }));
