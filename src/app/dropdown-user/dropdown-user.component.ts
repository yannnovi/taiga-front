import { Component, Inject, OnInit } from "@angular/core";
import { AJS_AUTH, AJS_AVATAR_SERVICE, AJS_NAV_URLS, AJS_ROOT_SCOPE, AJS_TG_LOCATION } from "../shared/ajs-tokens";

declare const _: any;

/**
 * Angular replacement for the AngularJS `tgDropdownUser` directive
 * (app/modules/navigation-bar/dropdown-user/), downgraded in place under the same name -
 * the user menu in the top navbar. Previously rejected for using `tg-nav` in its own
 * template - now unblocked by the Angular-native `TgNavDirective`.
 *
 * `tg-avatar` (template-less) replicated inline via `tgAvatarService`. The original's
 * `isFeedbackEnabled`/`customSupportUrl` scope fields were never actually referenced by
 * its own template - genuinely dead internal state (not an external binding contract like
 * the dead `@Output()`s kept elsewhere in this migration), dropped rather than ported.
 * `ng-class="{active: plugin.slug == currentPlugin.slug}"` referenced a `currentPlugin`
 * that was never part of this isolate-scope directive's scope either - always undefined,
 * so the `active` class never actually applied - kept as an always-undefined field for
 * fidelity, same treatment as `history-tabs`'s dead `top` reference earlier in this
 * migration.
 */
@Component({
    selector: "tg-dropdown-user",
    templateUrl: "./dropdown-user.component.html",
})
export class DropdownUserComponent implements OnInit {
    userSettingsPlugins: any[] = [];
    /** Always undefined - replicates the original template's dead `currentPlugin` reference. */
    currentPlugin: any;

    constructor(
        @Inject(AJS_AUTH) private auth: any,
        @Inject(AJS_AVATAR_SERVICE) private avatarService: any,
        @Inject(AJS_TG_LOCATION) private location: any,
        @Inject(AJS_NAV_URLS) private navUrls: any,
        @Inject(AJS_ROOT_SCOPE) private rootScope: any,
    ) {}

    ngOnInit(): void {
        this.userSettingsPlugins = _.filter(this.rootScope.userSettingsPlugins, { userMenu: true });
    }

    get user(): any {
        return this.auth.userData;
    }

    getAvatarUrl(): string {
        return this.avatarService.getAvatar(this.user).url;
    }

    logout(): void {
        this.auth.logout();
        this.location.url(this.navUrls.resolve("discover"));
        this.location.search({});
    }
}
