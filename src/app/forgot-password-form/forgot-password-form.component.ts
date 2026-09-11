import { Component, Inject } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { AJS_AUTH, AJS_CONFIRM, AJS_NAV_URLS, AJS_TG_LOCATION, AJS_TRANSLATE } from "../shared/ajs-tokens";
import { FormErrorMessageService } from "../shared/form-error-message.service";

/**
 * Angular replacement for the AngularJS `tgForgotPassword` directive
 * (app/coffee/modules/auth.coffee), downgraded in place under the same name, replacing
 * `.forgot-form-container(tg-forgot-password)` entirely (its whole subtree - no ambient
 * sibling markup to preserve, unlike `tgLogin`/`tgRegister`).
 *
 * Double-submit guard replicated as a literal 2-second lockout (`taiga.debounce`'s
 * `{leading: true, trailing: false}` semantics: first click runs immediately, any repeat
 * click within 2s is dropped, independent of when the network call itself resolves) -
 * not the `submitting`-flag pattern used elsewhere in this migration, since this file was
 * explicitly flagged to replicate the original's time-based lockout exactly.
 */
@Component({
    selector: "tg-forgot-password-form",
    templateUrl: "./forgot-password-form.component.html",
})
export class ForgotPasswordFormComponent {
    form = new FormGroup({
        username: new FormControl("", Validators.required),
    });

    private submitLocked = false;

    constructor(
        @Inject(AJS_AUTH) private auth: any,
        @Inject(AJS_CONFIRM) private confirm: any,
        @Inject(AJS_TG_LOCATION) private location: any,
        @Inject(AJS_NAV_URLS) private navUrls: any,
        @Inject(AJS_TRANSLATE) private translate: any,
        public errors: FormErrorMessageService,
    ) {}

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

        this.auth.forgotPassword(this.form.value).then(
            () => {
                this.location.path(this.navUrls.resolve("login"));

                const title = this.translate.instant("FORGOT_PASSWORD_FORM.SUCCESS_TITLE");
                const message = this.translate.instant("FORGOT_PASSWORD_FORM.SUCCESS_TEXT");

                this.confirm.success(title, message);
            },
            () => {
                this.confirm.notify("light-error", this.translate.instant("FORGOT_PASSWORD_FORM.ERROR"));
            },
        );
    }
}
