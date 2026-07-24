import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { WikiHistoryDiffComponent } from "./wiki-history-diff.component";

/**
 * Replaces the old AngularJS `tgWikiHistoryDiff` directive in place, under the same name,
 * on the pre-existing `taigaWikiHistory` module.
 */
angular
    .module("taigaWikiHistory")
    .directive("tgWikiHistoryDiff", downgradeComponent({ component: WikiHistoryDiffComponent }));
