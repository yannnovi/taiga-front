import { Component, Inject, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import {
    AJS_ANALYTICS,
    AJS_AUTH,
    AJS_CONFIG,
    AJS_CONFIRM,
    AJS_NAV_URLS,
    AJS_ROOT_SCOPE,
    AJS_ROUTE_PARAMS,
    AJS_TG_LOCATION,
    AJS_TRANSLATE,
    AJS_WINDOW,
} from "../shared/ajs-tokens";
import { FormErrorMessageService } from "../shared/form-error-message.service";

/**
 * Angular replacement for the AngularJS `tgRegister` directive
 * (app/coffee/modules/auth.coffee), downgraded in place, replacing
 * `.register-form-container(tg-register)` entirely.
 *
 * `tgRegisterOptions` (a completely empty extension-point directive - `return {}`, no
 * template/scope/link of its own) is dropped, not reproduced: it does nothing by itself
 * today, and any contrib-plugin override of it would need AngularJS's directive-merging
 * on a still-AngularJS element, which no longer applies once this page is an Angular
 * component - unlike the `authPlugins` contrib mechanism (see `<tg-auth-plugin-slot>`),
 * there is no concrete behavior here to preserve a bridge for.
 *
 * `tg-capslock` on the password field is dropped too - dead in the original (no
 * `ng-focus`/`ng-keyup` ever set `capslockIcon`/`iscapsLockActivated` on this page, unlike
 * `tgLogin`).
 *
 * `data.accepted_terms` (checked via `tg-terms-of-service-and-privacy-policy-notice`'s
 * two-way binding) is part of the payload sent to `$auth.register(data)` in the original,
 * not a separate step - kept that way here (`acceptedTerms` merged into the request body).
 *
 * Server-side field errors (`form.setErrors(response.data)`) mapped onto matching
 * `FormControl`s as `{server: message}`, same pattern as `LightboxCreateEditSprintComponent`.
 *
 * Double-submit guard: literal 2-second lockout, same as the rest of this sub-project.
 */
@Component({
    selector: "tg-register-form",
    templateUrl: "./register-form.component.html",
})
export class RegisterFormComponent implements OnInit {
    form = new FormGroup({
        username: new FormControl("", [Validators.required, Validators.maxLength(255), Validators.pattern(/^[\w.-]+$/)]),
        full_name: new FormControl("", [Validators.required, Validators.maxLength(256)]),
        email: new FormControl("", [Validators.required, Validators.maxLength(255), Validators.email]),
        password: new FormControl("", [Validators.required, Validators.minLength(4)]),
    });

    nextUrl = "";
    authPlugins: any[] = [];
    acceptedTerms: boolean | undefined;

    private submitLocked = false;

    constructor(
        @Inject(AJS_AUTH) private auth: any,
        @Inject(AJS_CONFIRM) private confirm: any,
        @Inject(AJS_TG_LOCATION) private location: any,
        @Inject(AJS_CONFIG) private config: any,
        @Inject(AJS_ROUTE_PARAMS) private routeParams: any,
        @Inject(AJS_NAV_URLS) private navUrls: any,
        @Inject(AJS_ANALYTICS) private analytics: any,
        @Inject(AJS_TRANSLATE) private translate: any,
        @Inject(AJS_WINDOW) private window: any,
        @Inject(AJS_ROOT_SCOPE) private rootScope: any,
        public errors: FormErrorMessageService,
    ) {}

    ngOnInit(): void {
        if (!this.config.get("publicRegisterEnabled")) {
            this.location.path(this.navUrls.resolve("not-found"));
            this.location.replace();
        }

        this.authPlugins = this.rootScope.authPlugins || [];

        const next = this.routeParams["next"];

        if (next && next !== this.navUrls.resolve("login")) {
            this.nextUrl = decodeURIComponent(next);
        } else {
            this.nextUrl = this.navUrls.resolve("home");
        }

        (this.window as any).prerenderReady = true;
    }

    onAcceptedTermsChange(value: boolean): void {
        this.acceptedTerms = value;
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

        const data = { ...this.form.value, accepted_terms: this.acceptedTerms };

        this.auth.register(data).then(
            () => {
                this.analytics.trackEvent("auth", "register", "user registration", 1);

                if (this.nextUrl.indexOf("http") === 0) {
                    this.window.location.href = this.nextUrl;
                } else {
                    this.location.url(this.nextUrl);
                }
            },
            (response: any) => {
                if (response.data._error_message) {
                    const text = this.translate.instant("COMMON.GENERIC_ERROR", { error: response.data._error_message });
                    this.confirm.notify("light-error", text);
                }

                Object.keys(response.data || {}).forEach((field) => {
                    const control = this.form.get(field);

                    if (control) {
                        const message = Array.isArray(response.data[field]) ? response.data[field][0] : response.data[field];

                        control.setErrors({ server: message });
                        control.markAsTouched();
                    }
                });
            },
        );
    }
}
