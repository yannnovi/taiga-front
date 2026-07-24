import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { HistoryTabsComponent } from "./history-tabs.component";

/**
 * Replaces the old AngularJS `tgHistoryTabs` directive in place, under the same name, on
 * the pre-existing `taigaHistory` module.
 */
angular.module("taigaHistory").directive("tgHistoryTabs", downgradeComponent({ component: HistoryTabsComponent }));
