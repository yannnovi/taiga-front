import { Component } from "@angular/core";
import { EmailTokenConfirmBaseComponent } from "../verify-email-form/email-token-confirm-base";

/**
 * Angular replacement for the AngularJS `tgChangeEmail` directive
 * (app/coffee/modules/auth.coffee), downgraded in place, replacing
 * `.change-email-form(tg-change-email)` entirely. See `EmailTokenConfirmBaseComponent`
 * (src/app/verify-email-form/) for the shared logic - this page and `tg-verify-email`
 * are functionally identical (same backend call), only the copy differs.
 */
@Component({
    selector: "tg-change-email-form",
    templateUrl: "./change-email-form.component.html",
})
export class ChangeEmailFormComponent extends EmailTokenConfirmBaseComponent {
    protected successMessageKey = "CHANGE_EMAIL_FORM.SUCCESS";
}
