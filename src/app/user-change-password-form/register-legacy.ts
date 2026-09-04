import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { UserChangePasswordFormComponent } from "./user-change-password-form.component";

/**
 * Replaces the old AngularJS `tgUserChangePassword` directive, registered on the
 * pre-existing `taigaUserSettings` module under the new component's own name
 * (`tg-user-change-password-form`, matching `user-change-password.jade`'s usage) rather
 * than the old directive's name, since the two aren't interchangeable (the old one was an
 * attribute on the `<form>` itself, this one is its own element).
 */
angular
    .module("taigaUserSettings")
    .directive("tgUserChangePasswordForm", downgradeComponent({ component: UserChangePasswordFormComponent }));
