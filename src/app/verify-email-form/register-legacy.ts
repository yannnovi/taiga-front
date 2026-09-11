import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { VerifyEmailFormComponent } from "./verify-email-form.component";

/**
 * Replaces the old AngularJS `tgVerifyEmail` directive, registered under the new
 * component's own name (`tg-verify-email-form`) rather than the old attribute directive's
 * name - same reasoning as `tg-forgot-password-form`.
 */
angular
    .module("taigaAuth")
    .directive("tgVerifyEmailForm", downgradeComponent({ component: VerifyEmailFormComponent }));
