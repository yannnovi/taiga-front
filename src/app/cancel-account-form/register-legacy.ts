import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { CancelAccountFormComponent } from "./cancel-account-form.component";

/**
 * Replaces the old AngularJS `tgCancelAccount` directive, registered under the new
 * component's own name (`tg-cancel-account-form`) rather than the old attribute
 * directive's name - same reasoning as `tg-forgot-password-form`.
 */
angular
    .module("taigaAuth")
    .directive("tgCancelAccountForm", downgradeComponent({ component: CancelAccountFormComponent }));
