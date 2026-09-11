import { Component, Inject, OnInit } from "@angular/core";
import { AJS_AUTH, AJS_CONFIRM, AJS_NAV_URLS, AJS_ROUTE_PARAMS, AJS_TG_LOCATION, AJS_TRANSLATE } from "../shared/ajs-tokens";

/**
 * Angular replacement for the AngularJS `tgCancelAccount` directive
 * (app/coffee/modules/auth.coffee), downgraded in place, replacing
 * `.cancel-account(tg-cancel-account)` entirely. No visible/editable fields (just a
 * hidden token from the route and a confirm button) - no `FormGroup` needed.
 *
 * **Bug found and fixed, not reproduced**: the original directive never injected
 * `$translate` at all (`CancelAccountDirective = ($repo, $model, $auth, $confirm,
 * $location, $params, $navUrls) -> ...`) yet called `$translate.instant(...)` in both its
 * success and error handlers - a `ReferenceError` on every submission (success path: the
 * `$auth.logout()`/redirect still ran first, so only the confirmation toast was lost;
 * error path: nothing ran at all, not even `$confirm.notify`, since the crash was the
 * handler's first line). Fixed by actually injecting `$translate`.
 *
 * Double-submit guard: literal 2-second lockout, same as the rest of this sub-project.
 */
@Component({
    selector: "tg-cancel-account-form",
    templateUrl: "./cancel-account-form.component.html",
})
export class CancelAccountFormComponent implements OnInit {
    private submitLocked = false;
    private cancelToken: string | undefined;

    constructor(
        @Inject(AJS_AUTH) private auth: any,
        @Inject(AJS_CONFIRM) private confirm: any,
        @Inject(AJS_TG_LOCATION) private location: any,
        @Inject(AJS_ROUTE_PARAMS) private routeParams: any,
        @Inject(AJS_NAV_URLS) private navUrls: any,
        @Inject(AJS_TRANSLATE) private translate: any,
    ) {}

    ngOnInit(): void {
        this.cancelToken = this.routeParams.cancel_token;
    }

    submit(): void {
        if (this.submitLocked) {
            return;
        }

        this.submitLocked = true;
        setTimeout(() => (this.submitLocked = false), 2000);

        this.auth.cancelAccount({ cancel_token: this.cancelToken }).then(
            () => {
                this.auth.logout();
                this.location.path(this.navUrls.resolve("home"));
                this.confirm.success(this.translate.instant("CANCEL_ACCOUNT.SUCCESS"));
            },
            (response: any) => {
                const text = this.translate.instant("COMMON.GENERIC_ERROR", { error: response.data._error_message });
                this.confirm.notify("error", text);
            },
        );
    }
}
