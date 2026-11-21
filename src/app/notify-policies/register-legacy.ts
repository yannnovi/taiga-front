import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { NotifyPoliciesListComponent } from "./notify-policies-list.component";

/**
 * User settings notification pages: replaces `tgUserNotificationsList`,
 * `tgUserLiveNotificationsList` and `tgUserWebNotificationsList` (the three
 * `tgUser*Notifications` page directives were empty and are just dropped).
 */
angular
    .module("taigaUserSettings")
    .directive("tgNotifyPoliciesList", downgradeComponent({ component: NotifyPoliciesListComponent }));
