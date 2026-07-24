import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { HistoryEntryComponent } from "./history-entry.component";

/**
 * Replaces the old AngularJS `tgHistoryEntry` directive in place, under the same name, on
 * the pre-existing `taigaHistory` module.
 */
angular.module("taigaHistory").directive("tgHistoryEntry", downgradeComponent({ component: HistoryEntryComponent }));
