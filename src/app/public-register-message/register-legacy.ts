import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { PublicRegisterMessageComponent } from "./public-register-message.component";

/**
 * Replaces the old AngularJS `tgPublicRegisterMessage` directive in place, under the same
 * name, on the pre-existing `taigaAuth` module.
 */
angular
    .module("taigaAuth")
    .directive("tgPublicRegisterMessage", downgradeComponent({ component: PublicRegisterMessageComponent }));
