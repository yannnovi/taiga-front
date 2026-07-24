import { Component, ElementRef, Inject, Input, OnInit } from "@angular/core";
import { AJS_LIGHTBOX_SERVICE, AJS_TG_RESOURCES } from "../shared/ajs-tokens";

declare const $: any;

/**
 * Angular replacement for the AngularJS `tgLbDisplayHistoric` directive
 * (app/modules/history/history-lightbox/), downgraded in place under the same name -
 * shows a comment's edit history. Its one caller (comment.controller.coffee, backing the
 * still-AngularJS `tgComment` - not migrated, see MIGRATION.md's wysiwyg exclusion) needed
 * its `lightboxFactory.create` attrs switched to `bind-x`. Uses the already-migrated
 * `tg-history-entry` natively.
 *
 * The original's `link` called `lightboxService.open(el)` directly (it's what actually
 * makes the lightbox visible - adds the `.open` class and sets `display: flex`); replicated
 * here in the constructor, same as `NewsletterEmailLightboxComponent`.
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

    constructor(
        private elementRef: ElementRef,
        @Inject(AJS_LIGHTBOX_SERVICE) private lightboxService: any,
        @Inject(AJS_TG_RESOURCES) private rs: any,
    ) {
        this.lightboxService.open($(this.elementRef.nativeElement));
    }

    ngOnInit(): void {
        this.rs.history.getCommentHistory(this.name, this.object, this.comment.id).then((data: any) => {
            this.commentHistoryEntries = data;
        });
    }
}
