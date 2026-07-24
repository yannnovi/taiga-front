import { Component, Inject, Input, OnChanges } from "@angular/core";
import { AJS_AVATAR_SERVICE } from "../shared/ajs-tokens";

/**
 * Angular replacement for the AngularJS `tgWikiHistoryEntry` directive
 * (app/modules/wiki/history/), downgraded in place under the same name. `tg-avatar`
 * (template-less) replicated inline via `tgAvatarService`. `ng-alt="{{singleHistoryEntry.user.name}}"`
 * in the original isn't a real AngularJS attribute (no `ngAlt` directive exists) - dead
 * markup, same as history-entry's identical finding earlier in this migration - omitted.
 * Uses the already-migrated `tg-wiki-history-diff` natively.
 */
@Component({
    selector: "tg-wiki-history-entry",
    templateUrl: "./wiki-history-entry.component.html",
})
export class WikiHistoryEntryComponent implements OnChanges {
    @Input() historyEntry: any;

    singleHistoryEntry: any;
    avatar: any;

    constructor(@Inject(AJS_AVATAR_SERVICE) private avatarService: any) {}

    ngOnChanges(): void {
        this.singleHistoryEntry = this.historyEntry.toJS();
        this.avatar = this.avatarService.getAvatar(this.singleHistoryEntry.user);
    }

    valuesDiffEntries(): [string, any][] {
        return Object.entries(this.singleHistoryEntry.values_diff || {});
    }
}
