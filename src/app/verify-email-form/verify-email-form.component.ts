import { Component } from "@angular/core";
import { EmailTokenConfirmBaseComponent } from "./email-token-confirm-base";

/**
 * Angular replacement for the AngularJS `tgVerifyEmail` directive
 * (app/coffee/modules/auth.coffee), downgraded in place, replacing
 * `.verify-email-form(tg-verify-email)` entirely. See `EmailTokenConfirmBaseComponent`
 * for the shared logic (and the "verify-email actually calls changeEmail" finding).
 */
@Component({
    selector: "tg-verify-email-form",
    templateUrl: "./verify-email-form.component.html",
})
export class VerifyEmailFormComponent extends EmailTokenConfirmBaseComponent {
    protected successMessageKey = "VERIFY_EMAIL_FORM.SUCCESS";
}
