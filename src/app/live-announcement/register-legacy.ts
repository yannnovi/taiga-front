import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { LiveAnnouncementComponent } from "./live-announcement.component";

/**
 * Replaces the old AngularJS `tgLiveAnnouncement` directive in place, under the same
 * name, on the pre-existing `taigaComponents` module.
 */
angular
    .module("taigaComponents")
    .directive("tgLiveAnnouncement", downgradeComponent({ component: LiveAnnouncementComponent }));
