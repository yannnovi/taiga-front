import { Component, Inject, Input, OnInit } from "@angular/core";
import { AJS_TG_RESOURCES } from "../shared/ajs-tokens";

/**
 * Angular replacement for the AngularJS `tgLbDisplayHistoric` directive
 * (app/modules/history/history-lightbox/), downgraded in place under the same name -
 * shows a comment's edit history. Its one caller (comment.controller.coffee, backing the
 * still-AngularJS `tgComment` - not migrated, see MIGRATION.md's wysiwyg exclusion) needed
 * its `lightboxFactory.create` attrs switched to `bind-x`. Uses the already-migrated
 * `tg-history-entry` natively.
 */
@Component({
    selector: "tg-lb-display-historic",
    templateUrl: "./lightbox-display-historic.component.html",
})
export class LightboxDisplayHistoricComponent implements OnInit {
    @Input() name: any;
    @Input() object: any;
    @Input() comment: any;

    commentHistoryEntries: any;

    constructor(@Inject(AJS_TG_RESOURCES) private rs: any) {}

    ngOnInit(): void {
        this.rs.history.getCommentHistory(this.name, this.object, this.comment.id).then((data: any) => {
            this.commentHistoryEntries = data;
        });
    }
}
