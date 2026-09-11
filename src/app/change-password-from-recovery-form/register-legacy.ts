import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { ChangePasswordFromRecoveryFormComponent } from "./change-password-from-recovery-form.component";

/**
 * Replaces the old AngularJS `tgChangePasswordFromRecovery` directive, registered under
 * the new component's own name (`tg-change-password-from-recovery-form`) rather than the
 * old attribute directive's name - same reasoning as `tg-forgot-password-form`.
 */
angular
    .module("taigaAuth")
    .directive(
        "tgChangePasswordFromRecoveryForm",
        downgradeComponent({ component: ChangePasswordFromRecoveryFormComponent }),
    );
