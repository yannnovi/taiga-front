import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { RegisterFormComponent } from "./register-form.component";

/**
 * Replaces the old AngularJS `tgRegister` directive, registered under the new component's
 * own name (`tg-register-form`) rather than the old attribute directive's name - same
 * reasoning as `tg-forgot-password-form`.
 */
angular.module("taigaAuth").directive("tgRegisterForm", downgradeComponent({ component: RegisterFormComponent }));
