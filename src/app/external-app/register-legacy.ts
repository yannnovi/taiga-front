import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { ExternalAppComponent } from "./external-app.component";

/**
 * Exposes ExternalAppComponent to AngularJS as `<tg-external-app>`, registered on the
 * pre-existing `taigaExternalApps` module. The "/external-apps" ngRoute route now renders
 * `template: "<tg-external-app></tg-external-app>"`.
 */
angular
    .module("taigaExternalApps")
    .directive("tgExternalApp", downgradeComponent({ component: ExternalAppComponent }));
