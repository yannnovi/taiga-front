import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { ChangeEmailFormComponent } from "./change-email-form.component";

/**
 * Replaces the old AngularJS `tgChangeEmail` directive, registered under the new
 * component's own name (`tg-change-email-form`) rather than the old attribute directive's
 * name - same reasoning as `tg-forgot-password-form`.
 */
angular
    .module("taigaAuth")
    .directive("tgChangeEmailForm", downgradeComponent({ component: ChangeEmailFormComponent }));
