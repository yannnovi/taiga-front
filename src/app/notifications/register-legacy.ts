import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { NotificationsComponent } from "./notifications.component";

/**
 * Exposes NotificationsComponent to AngularJS as `<tg-notifications>`, registered on the
 * pre-existing `taigaNotifications` module. The "/notifications" ngRoute route now
 * renders `template: "<tg-notifications></tg-notifications>"`.
 */
angular
    .module("taigaNotifications")
    .directive("tgNotifications", downgradeComponent({ component: NotificationsComponent }));
