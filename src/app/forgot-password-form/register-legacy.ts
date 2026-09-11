import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { ForgotPasswordFormComponent } from "./forgot-password-form.component";

/**
 * Replaces the old AngularJS `tgForgotPassword` directive, registered on the pre-existing
 * `taigaAuth` module under the new component's own name (`tg-forgot-password-form`) rather
 * than the old directive's name - the two aren't interchangeable (the old one was an
 * attribute on a wrapping `div`, this one is its own element; downgraded components are
 * always element-only). Same reasoning as `tg-user-change-password-form` (see
 * MIGRATION.md, sous-projet 4g, for the silent-failure bug this exact mismatch caused
 * there).
 */
angular
    .module("taigaAuth")
    .directive("tgForgotPasswordForm", downgradeComponent({ component: ForgotPasswordFormComponent }));
