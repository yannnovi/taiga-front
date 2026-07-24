import { Component, Inject, Input, OnChanges } from "@angular/core";
import { AJS_AVATAR_SERVICE, AJS_USER_SERVICE } from "../shared/ajs-tokens";

/**
 * Angular replacement for the AngularJS `tgProfileBar` directive
 * (app/modules/profile/profile-bar/), downgraded in place under the same name.
 *
 * Previously rejected in an earlier batch because its own template used `tg-nav` - now
 * unblocked by the new Angular-native `TgNavDirective` (src/app/shared/tg-nav.directive.ts):
 * `tg-nav="user-settings-user-profile"` (a static route name, no params) becomes
 * `[tgNav]="'user-settings-user-profile'"`.
 *
 * `tg-avatar-big` (template-less, the same directive function as `tg-avatar` registered
 * under a second name - app/modules/components/avatar/avatar.directive.coffee) replicated
 * inline via `tgAvatarService.getAvatar(user, 'avatarBig')`, matching the original's
 * attribute-name-based sizing switch.
 */
@Component({
    selector: "tg-profile-bar",
    templateUrl: "./profile-bar.component.html",
})
export class ProfileBarComponent implements OnChanges {
    @Input() user: any;
    @Input() isCurrentUser: any;

    stats: any;

    constructor(
        @Inject(AJS_USER_SERVICE) private userService: any,
        @Inject(AJS_AVATAR_SERVICE) private avatarService: any,
    ) {}

    ngOnChanges(): void {
        if (this.user) {
            this.loadStats();
        }
    }

    private loadStats(): void {
        this.userService.getStats(this.user.get("id")).then((stats: any) => {
            this.stats = stats;
        });
    }

    getAvatarUrl(): string {
        return this.avatarService.getAvatar(this.user, "avatarBig").url;
    }

    bioPreview(): string {
        const bio: string = this.user.get("bio") || "";

        return bio.slice(0, 210) + (bio.length < 210 ? "" : "...");
    }
}
