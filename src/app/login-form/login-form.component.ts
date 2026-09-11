import { Component, Inject, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import {
    AJS_ANALYTICS,
    AJS_AUTH,
    AJS_CONFIG,
    AJS_CONFIRM,
    AJS_EVENTS,
    AJS_NAV_URLS,
    AJS_ROOT_SCOPE,
    AJS_ROUTE_PARAMS,
    AJS_TG_LOCATION,
    AJS_TRANSLATE,
    AJS_WINDOW,
} from "../shared/ajs-tokens";
import { FormErrorMessageService } from "../shared/form-error-message.service";

/**
 * Angular replacement for the AngularJS `tgLogin` directive
 * (app/coffee/modules/auth.coffee), downgraded in place, replacing
 * `.login-form-container(tg-login)` entirely - form fields, capslock detection, the
 * contrib-plugins ("auth" type - external, `$rootScope.authPlugins`) block, and
 * `<tg-public-register-message>` (already an Angular component, called directly).
 *
 * Contrib plugins render via `<tg-auth-plugin-slot>` (`TgAuthPluginSlotUpgradedDirective`,
 * src/app/upgraded/) - a small `UpgradeComponent`-wrapped bridge purpose-built for this
 * sub-project, since the plugin's `ng-include`-driven template only makes sense to
 * AngularJS's `$compile`. See MIGRATION.md for why.
 *
 * Capslock detection reproduced exactly, including its original crudeness: `onFocus`
 * *toggles* `capslockIcon` (not "set true on focus") and `onKeyUp` re-derives
 * `iscapsLockActivated` from whether the typed value differs from its own lowercased form
 * - a rough heuristic, not a real capslock-key read, faithfully kept as-is (this is the
 * *only* auth page where `tg-capslock` was ever actually wired up - every other page in
 * this sub-project had it present but dead, and it isn't reproduced there).
 *
 * Double-submit guard: literal 2-second lockout (`taiga.debounce`'s
 * `{leading: true, trailing: false}`), replicated as a self-clearing boolean rather than
 * the `submitting`-flag-until-response pattern used elsewhere in this migration - this
 * file was explicitly flagged to replicate the original's time-based lockout.
 */
@Component({
    selector: "tg-login-form",
    templateUrl: "./login-form.component.html",
})
export class LoginFormComponent implements OnInit {
    form = new FormGroup({
        username: new FormControl("", Validators.required),
        password: new FormControl("", Validators.required),
    });

    defaultLoginEnabled = true;
    nextUrl = "";
    authPlugins: any[] = [];
    capslockIcon = false;
    iscapsLockActivated = false;

    private submitLocked = false;

    constructor(
        @Inject(AJS_AUTH) private auth: any,
        @Inject(AJS_CONFIRM) private confirm: any,
        @Inject(AJS_TG_LOCATION) private location: any,
        @Inject(AJS_CONFIG) private config: any,
        @Inject(AJS_ROUTE_PARAMS) private routeParams: any,
        @Inject(AJS_NAV_URLS) private navUrls: any,
        @Inject(AJS_EVENTS) private events: any,
        @Inject(AJS_TRANSLATE) private translate: any,
        @Inject(AJS_WINDOW) private window: any,
        @Inject(AJS_ANALYTICS) private analytics: any,
        @Inject(AJS_ROOT_SCOPE) private rootScope: any,
        public errors: FormErrorMessageService,
    ) {}

    ngOnInit(): void {
        this.defaultLoginEnabled = this.config.get("defaultLoginEnabled", true);
        this.authPlugins = this.rootScope.authPlugins || [];

        const next = this.routeParams["next"];

        if (next && next !== this.navUrls.resolve("login") && !next.startsWith("%2Fdiscover")) {
            this.nextUrl = decodeURIComponent(next);
        } else {
            this.nextUrl = this.navUrls.resolve("home");
        }

        if (this.routeParams["force_next"]) {
            this.nextUrl = decodeURIComponent(this.routeParams["force_next"]);
        }

        (this.window as any).prerenderReady = true;
    }

    onFocus(): void {
        this.capslockIcon = !this.capslockIcon;
    }

    onKeyUp(event: Event): void {
        const value = (event.target as HTMLInputElement).value;

        this.iscapsLockActivated = value !== value.toLowerCase();
    }

    submit(): void {
        if (this.submitLocked) {
            return;
        }

        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.submitLocked = true;
        setTimeout(() => (this.submitLocked = false), 2000);

        const loginFormType = this.config.get("loginFormType", "normal");

        this.auth.login(this.form.value, loginFormType).then(
            () => {
                this.events.setupConnection();
                this.analytics.trackEvent("auth", "login", "user login", 1);

                if (this.nextUrl.indexOf("http") === 0) {
                    this.window.location.href = this.nextUrl;
                } else {
                    this.location.url(this.nextUrl);
                }
            },
            () => {
                this.confirm.notify("light-error", this.translate.instant("LOGIN_FORM.ERROR_AUTH_INCORRECT"));
            },
        );
    }
}
