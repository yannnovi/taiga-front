import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { WikiHistoryEntryComponent } from "./wiki-history-entry.component";

/**
 * Replaces the old AngularJS `tgWikiHistoryEntry` directive in place, under the same name,
 * on the pre-existing `taigaWikiHistory` module.
 */
angular
    .module("taigaWikiHistory")
    .directive("tgWikiHistoryEntry", downgradeComponent({ component: WikiHistoryEntryComponent }));
