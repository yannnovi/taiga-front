import { Component, Inject, Input, OnChanges } from "@angular/core";
import { AJS_AVATAR_SERVICE } from "../shared/ajs-tokens";

/**
 * Angular replacement for the AngularJS `tgHistoryEntry` directive
 * (app/modules/history/history-lightbox/), downgraded in place under the same name.
 *
 * `tg-avatar` (no template, same family as tg-loading/tg-autofocus) replicated inline via
 * `tgAvatarService`, same technique as external-app. `ng-alt="{{entry.user.name}}"` in the
 * original isn't a real AngularJS attribute - a no-op, same category as other dead markup
 * found elsewhere - omitted.
 */
@Component({
    selector: "tg-history-entry",
    templateUrl: "./history-entry.component.html",
})
export class HistoryEntryComponent implements OnChanges {
    @Input() entry: any;

    avatar: any;
    displayFullEntry = false;

    constructor(@Inject(AJS_AVATAR_SERVICE) private avatarService: any) {}

    ngOnChanges(): void {
        if (this.entry) {
            this.avatar = this.avatarService.getAvatar(this.entry.user);
        }
    }

    toggleDisplayFullEntry(): void {
        this.displayFullEntry = !this.displayFullEntry;
    }
}
