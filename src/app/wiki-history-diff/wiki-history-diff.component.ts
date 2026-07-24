import { Component, Input } from "@angular/core";

/**
 * Angular replacement for the AngularJS `tgWikiHistoryDiff` directive
 * (app/modules/wiki/history/), downgraded in place under the same name. Inlines the Jade
 * `include history-templates/history-attachments` the original template used - Jade
 * includes are compile-time composition with no Angular equivalent, same as
 * tag-line-common's inlined includes earlier in this migration.
 */
@Component({
    selector: "tg-wiki-history-diff",
    templateUrl: "./wiki-history-diff.component.html",
})
export class WikiHistoryDiffComponent {
    @Input() key: any;
    @Input() diff: any;
}
