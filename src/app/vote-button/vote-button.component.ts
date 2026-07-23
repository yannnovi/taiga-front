import { Component, Inject, Input } from "@angular/core";
import { AJS_CURRENT_USER_SERVICE } from "../shared/ajs-tokens";

/**
 * Angular replacement for the AngularJS `tgVoteButton` directive
 * (app/modules/components/vote-button/). Downgraded in place under the same directive
 * name. Its one caller (issues-detail.jade, still AngularJS) used plain `item`/`on-upvote`/
 * `on-downvote` attributes - switched to `bind-item`/`bind-on-upvote`/`bind-on-downvote`
 * (see MIGRATION.md). `onUpvote`/`onDownvote` are AngularJS `=` bindings (actual function
 * *values*, not `&` expressions), so they're `@Input()`s called directly - no `@Output()`/
 * EventEmitter involved, unlike discover-home-order-by's `onChange`.
 *
 * Known simplification: the original wrapped the vote count in `tg-loading`, a directive
 * that swaps in a jQuery-driven spinner overlay while `loading` is true
 * (app/coffee/modules/common/loading.coffee) - it has no template of its own and does
 * nontrivial DOM manipulation, so it isn't a good UpgradeComponent fit (same category as
 * tg-avatar) and replicating the overlay exactly wasn't worth it for a single, brief,
 * cosmetic loading spinner. `loading` is still tracked and exposed identically (matching
 * vote-button.controller.spec.coffee's expectations), just without the visual overlay.
 */
@Component({
    selector: "tg-vote-button",
    templateUrl: "./vote-button.component.html",
})
export class VoteButtonComponent {
    @Input() item: any;
    @Input() onUpvote!: () => Promise<any>;
    @Input() onDownvote!: () => Promise<any>;

    user: any;
    loading = false;

    constructor(@Inject(AJS_CURRENT_USER_SERVICE) currentUserService: any) {
        this.user = currentUserService.getUser();
    }

    toggleVote(): Promise<any> {
        this.loading = true;

        const promise = this.item.is_voter ? this.onDownvote() : this.onUpvote();

        promise.finally(() => (this.loading = false));

        return promise;
    }
}
