import { Component, EventEmitter, Input, Output } from "@angular/core";

/**
 * Angular replacement for the AngularJS `tgHistoryTabs` directive
 * (app/modules/history/history-tabs/), downgraded in place under the same name. The
 * original had no controller at all - a bare isolate scope directive.
 *
 * `@Output()`s named `activeComments`/`activeActivities`/`orderComments` (not
 * `onActiveComments`/etc.) so the existing `on-active-comments`/`on-active-activities`/
 * `on-order-comments` attributes on the one caller keep matching - same gotcha as
 * everywhere else in this migration. `showCommentTab`/`showActivityTab` were `&` bindings
 * called with no arguments (`vm.showCommentTab()`) - simplified to plain `@Input()`
 * booleans, same as `tag`'s `isArchived`/`hasPermissions`: `bind-show-comment-tab` still
 * re-evaluates the expression on every digest, so it stays just as "live" as a function
 * call. `onReverse` is a one-way `@Input()` despite its name (the original declared it
 * `"<"`, not `"&"` - a misleadingly-named boolean flag, not an actual event), kept as-is
 * for fidelity. `ng-class="{'new-first': top, ...}"` in the original template referenced
 * a `top` that was never part of the directive's scope - a pre-existing dead reference
 * (always falsy) - replicated as-is rather than "fixed".
 */
@Component({
    selector: "tg-history-tabs",
    templateUrl: "./history-tabs.component.html",
})
export class HistoryTabsComponent {
    @Input() showCommentTab = false;
    @Input() showActivityTab = false;
    @Input() activeTab: any;
    @Input() commentsNum: any;
    @Input() activitiesNum: any;
    @Input() onReverse: any;

    @Output() activeComments = new EventEmitter<void>();
    @Output() activeActivities = new EventEmitter<void>();
    @Output() orderComments = new EventEmitter<void>();

    /** Always undefined - replicates the original template's dead `top` scope reference. */
    top: any;
}
