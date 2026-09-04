import { Component, Inject } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { AJS_CONFIRM, AJS_TG_RESOURCES, AJS_TRANSLATE } from "../shared/ajs-tokens";
import { FormErrorMessageService } from "../shared/form-error-message.service";

/**
 * Angular replacement for the AngularJS `tgUserChangePassword` directive
 * (app/coffee/modules/user-settings/change-password.coffee), downgraded in place under the
 * same name. `UserChangePasswordController` (sets `sectionName`/`user`) is untouched.
 *
 * `currentPassword` was never validated in the original (no `data-required`) - kept
 * unvalidated here too, not "fixed". `newPassword1`/`newPassword2` are required.
 *
 * The password-match check is deliberately **not** wired through the shared
 * `equalToValidator` (`checksley-validators.ts`), even though it exists for exactly this
 * kind of cross-field case: the original only ran it *after* checksley's own `validate()`
 * (i.e. after both fields pass their `required` check) and surfaced a mismatch as a
 * `$confirm.notify('error', ...)` toast, not an inline field error. Routing it through a
 * `FormGroup`-level validator would naturally push it towards an inline error instead -
 * reproduced as a plain manual check after the two controls' own validity, toast and all,
 * to keep the exact original UX.
 *
 * `tg-capslock` (`common.coffee`) on this template relies on `$scope.iscapsLockActivated`/
 * `capslockIcon`, which only `auth.coffee`'s login page ever sets - neither this directive
 * nor `UserChangePasswordController` did, so the warning icon was already permanently dead
 * on this specific page in the original. Not reproduced.
 */
@Component({
    selector: "tg-user-change-password-form",
    templateUrl: "./user-change-password-form.component.html",
})
export class UserChangePasswordFormComponent {
    form = new FormGroup({
        currentPassword: new FormControl(""),
        newPassword1: new FormControl("", Validators.required),
        newPassword2: new FormControl("", Validators.required),
    });

    submitting = false;

    constructor(
        @Inject(AJS_TG_RESOURCES) private rs: any,
        @Inject(AJS_CONFIRM) private confirm: any,
        @Inject(AJS_TRANSLATE) private translate: any,
        public errors: FormErrorMessageService,
    ) {}

    submit(): void {
        if (this.submitting) {
            return;
        }

        const password1 = this.form.get("newPassword1")!;
        const password2 = this.form.get("newPassword2")!;

        if (password1.invalid || password2.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        if (password1.value !== password2.value) {
            this.confirm.notify("error", this.translate.instant("CHANGE_PASSWORD.ERROR_PASSWORD_MATCH"));
            return;
        }

        this.submitting = true;

        this.rs.userSettings.changePassword(this.form.value.currentPassword, password1.value).then(
            () => {
                this.submitting = false;
                this.confirm.notify("success");
            },
            (response: any) => {
                this.submitting = false;
                this.confirm.notify("error", response.data._error_message);
            },
        );
    }
}
