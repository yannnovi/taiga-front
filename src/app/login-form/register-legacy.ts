import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { LoginFormComponent } from "./login-form.component";

/**
 * Replaces the old AngularJS `tgLogin` directive, registered under the new component's
 * own name (`tg-login-form`) rather than the old attribute directive's name - same
 * reasoning as `tg-forgot-password-form`.
 */
angular.module("taigaAuth").directive("tgLoginForm", downgradeComponent({ component: LoginFormComponent }));
