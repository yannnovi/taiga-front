import { Directive, Inject, OnInit } from "@angular/core";
import {
    AJS_AUTH,
    AJS_CONFIRM,
    AJS_NAV_URLS,
    AJS_REPO,
    AJS_ROUTE_PARAMS,
    AJS_TG_LOCATION,
    AJS_TRANSLATE,
} from "../shared/ajs-tokens";

/**
 * Shared base for `VerifyEmailFormComponent`/`ChangeEmailFormComponent` - the AngularJS
 * originals (`tgVerifyEmail`/`tgChangeEmail`, app/coffee/modules/auth.coffee) are
 * near-identical: same fields (a single hidden `email_token` from the route), same submit
 * logic, and - found while reading both side by side - **both actually call the same
 * `$auth.changeEmail(data)` API method** (`AuthService` has no separate "verify email"
 * endpoint at all) - "verify your new account's email" and "change your email address"
 * are the same backend confirmation flow under two different pages/URLs/copy. Preserved
 * exactly (not consolidated into one route) - only the translated title/subtitle/success
 * message differ, via `successMessageKey`.
 *
 * No double-submit guard here, unlike every other form in this sub-project - the original
 * had none for these two directives either (`submit = -> ...`, not
 * `debounce 2000, (event) => ...`), an asymmetry worth preserving rather than "fixing".
 */
@Directive()
export abstract class EmailTokenConfirmBaseComponent implements OnInit {
    protected abstract successMessageKey: string;

    private emailToken: string | undefined;

    constructor(
        @Inject(AJS_REPO) private repo: any,
        @Inject(AJS_AUTH) private auth: any,
        @Inject(AJS_CONFIRM) private confirm: any,
        @Inject(AJS_TG_LOCATION) private location: any,
        @Inject(AJS_ROUTE_PARAMS) private routeParams: any,
        @Inject(AJS_NAV_URLS) private navUrls: any,
        @Inject(AJS_TRANSLATE) private translate: any,
    ) {}

    ngOnInit(): void {
        this.emailToken = this.routeParams.email_token;
    }

    submit(): void {
        this.auth.changeEmail({ email_token: this.emailToken }).then(
            () => {
                if (this.auth.isAuthenticated()) {
                    this.repo.queryOne("users", this.auth.getUser().id).then((data: any) => this.auth.setUser(data));
                    this.location.url(this.navUrls.resolve("home"));
                } else {
                    this.location.url(this.navUrls.resolve("login"));
                }

                this.confirm.success(this.translate.instant(this.successMessageKey));
            },
            (response: any) => {
                const text = this.translate.instant("COMMON.GENERIC_ERROR", { error: response.data._error_message });
                this.confirm.notify("light-error", text);
            },
        );
    }
}
