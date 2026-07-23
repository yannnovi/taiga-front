import { Component, Inject } from "@angular/core";
import {
    AJS_AVATAR_SERVICE,
    AJS_CURRENT_USER_SERVICE,
    AJS_EXTERNAL_APPS_SERVICE,
    AJS_LOADER,
    AJS_LOCATION,
    AJS_NAV_URLS,
    AJS_ROUTE_PARAMS,
    AJS_WINDOW,
    AJS_XHR_ERROR_SERVICE,
} from "../shared/ajs-tokens";

/**
 * Angular replacement for the old AngularJS `ExternalApp` route controller
 * (app/modules/external-apps/external-app.controller.coffee + .jade). Downgraded as
 * `<tg-external-app>` for the "/external-apps" route.
 *
 * The original template used the `tg-avatar` attribute directive
 * (app/modules/components/avatar/avatar.directive.coffee) to render the user's avatar.
 * That directive has no template of its own - it just mutates its host `<img>`'s
 * src/title/alt/background directly via a link function - so wrapping it with
 * UpgradeComponent (designed for directives that render their own content) doesn't fit.
 * Instead, `tgAvatarService.getAvatar()` is called directly here and bound onto a plain
 * `<img>` with ordinary Angular bindings - simpler, and the more natural "migration"
 * (rather than "wrapping") for a directive that was really just presentational logic.
 */
@Component({
    selector: "tg-external-app",
    templateUrl: "./external-app.component.html",
})
export class ExternalAppComponent {
    application: any = null;
    user: any;
    avatar: any;
    loginWithAnotherUserUrl: string;

    private applicationId: string;
    private state: string;

    constructor(
        @Inject(AJS_ROUTE_PARAMS) routeParams: any,
        @Inject(AJS_EXTERNAL_APPS_SERVICE) private externalAppsService: any,
        @Inject(AJS_WINDOW) private window: any,
        @Inject(AJS_CURRENT_USER_SERVICE) currentUserService: any,
        @Inject(AJS_LOCATION) location: any,
        @Inject(AJS_NAV_URLS) navUrls: any,
        @Inject(AJS_XHR_ERROR_SERVICE) private xhrError: any,
        @Inject(AJS_LOADER) private loader: any,
        @Inject(AJS_AVATAR_SERVICE) private avatarService: any,
    ) {
        this.loader.start(false);
        this.applicationId = routeParams.application;
        this.state = routeParams.state;
        this.getApplicationToken();

        this.user = currentUserService.getUser();
        this.avatar = this.avatarService.getAvatar(this.user);

        const nextUrl = encodeURIComponent(location.url());
        const loginUrl = navUrls.resolve("login");
        this.loginWithAnotherUserUrl = `${loginUrl}?next=${nextUrl}&force_login=1`;
    }

    private redirect(applicationToken: any): void {
        const nextUrl = applicationToken.get("next_url");
        this.window.open(nextUrl, "_self");
    }

    private getApplicationToken(): any {
        return this.externalAppsService
            .getApplicationToken(this.applicationId, this.state)
            .then((data: any) => {
                this.application = data.get("application");

                if (data.get("auth_code")) {
                    this.redirect(data);
                } else {
                    this.loader.pageLoaded();
                }
            })
            .catch((xhr: any) => {
                this.loader.pageLoaded();
                return this.xhrError.response(xhr);
            });
    }

    cancel(): void {
        this.window.history.back();
    }

    createApplicationToken(): any {
        return this.externalAppsService
            .authorizeApplicationToken(this.applicationId, this.state)
            .then((data: any) => this.redirect(data))
            .catch((xhr: any) => this.xhrError.response(xhr));
    }
}
