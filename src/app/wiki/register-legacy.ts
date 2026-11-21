import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { WikiNavComponent, WikiSummaryComponent, WikiWysiwygComponent } from "./wiki.components";

/** Replace `tgWikiNav`, `tgWikiSummary` and `tgWikiWysiwyg` (same names, now elements). */
angular
    .module("taigaWiki")
    .directive("tgWikiNav", downgradeComponent({ component: WikiNavComponent }))
    .directive("tgWikiSummary", downgradeComponent({ component: WikiSummaryComponent }))
    .directive("tgWikiWysiwyg", downgradeComponent({ component: WikiWysiwygComponent }));
