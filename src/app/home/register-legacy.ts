import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { HomeComponent } from "./home.component";

/**
 * Exposes HomeComponent to AngularJS as `<tg-home>`, registered on the pre-existing
 * `taigaHome` module (still declared by app/modules/home/home.module.coffee, still listed
 * as a dependency of the root "taiga" module in app/coffee/app.coffee). The "/" ngRoute
 * route now renders `template: "<tg-home></tg-home>"` instead of the old
 * templateUrl/controller pair.
 */
angular.module("taigaHome").directive("tgHome", downgradeComponent({ component: HomeComponent }));
