import { Component, Inject, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { AJS_AUTH, AJS_CONFIRM, AJS_NAV_URLS, AJS_ROUTE_PARAMS, AJS_TG_LOCATION, AJS_TRANSLATE } from "../shared/ajs-tokens";
import { equalToValidator } from "../shared/checksley-validators";
import { FormErrorMessageService } from "../shared/form-error-message.service";

/**
 * Angular replacement for the AngularJS `tgChangePasswordFromRecovery` directive
 * (app/coffee/modules/auth.coffee), downgraded in place, replacing
 * `.change-password-form-container(tg-change-password-from-recovery)` entirely.
 *
 * `data-equalto="#password"` on the original's `password2` field is the one real
 * checksley `equalTo` usage in this whole sub-project (unlike `user-change-password`,
 * which checked the mismatch by hand and deliberately wasn't routed through this
 * validator - see MIGRATION.md sous-projet 4g) - ported to the shared FormGroup-level
 * `equalToValidator`.
 *
 * **Bug found and fixed, not reproduced**: the original's "no token in the route params"
 * branch referenced an undefined `response` variable (`response.data.token.map(...)`) -
 * a `ReferenceError` that would abort the rest of the AngularJS `link` function
 * (including the `checksley()` setup) on the spot. In practice this branch is dead code -
 * the route (`/change-password/:token`) requires the `:token` segment, so
 * `$routeParams.token` is always set - but ported here as a plain redirect-to-login
 * without the broken message, same class of fix as `CancelAccountFormComponent`'s missing
 * `$translate` injection.
 *
 * Double-submit guard: literal 2-second lockout, same as the rest of this sub-project
 * (see `ForgotPasswordFormComponent`).
 */
@Component({
    selector: "tg-change-password-from-recovery-form",
    templateUrl: "./change-password-from-recovery-form.component.html",
})
export class ChangePasswordFromRecoveryFormComponent implements OnInit {
    form = new FormGroup(
        {
            password: new FormControl("", Validators.required),
            password2: new FormControl("", Validators.required),
        },
        { validators: equalToValidator("password2", "password") },
    );

    tokenInParams = false;

    private submitLocked = false;
    private token: string | undefined;

    constructor(
        @Inject(AJS_AUTH) private auth: any,
        @Inject(AJS_CONFIRM) private confirm: any,
        @Inject(AJS_TG_LOCATION) private location: any,
        @Inject(AJS_ROUTE_PARAMS) private routeParams: any,
        @Inject(AJS_NAV_URLS) private navUrls: any,
        @Inject(AJS_TRANSLATE) private translate: any,
        public errors: FormErrorMessageService,
    ) {}

    ngOnInit(): void {
        if (this.routeParams.token) {
            this.tokenInParams = true;
            this.token = this.routeParams.token;
        } else {
            this.location.path(this.navUrls.resolve("login"));
        }
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

        this.auth.changePasswordFromRecovery({ token: this.token, password: this.form.value.password }).then(
            () => {
                this.location.path(this.navUrls.resolve("login"));
                this.confirm.success(this.translate.instant("CHANGE_PASSWORD_RECOVERY_FORM.SUCCESS"));
            },
            (response: any) => {
                const text = (response.data.password || []).map((m: string) => ` ${m}`).join(",");
                this.confirm.notify("light-error", text);
            },
        );
    }
}
