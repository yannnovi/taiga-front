import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { UserTimelineAttachmentComponent } from "./user-timeline-attachment.component";

/**
 * Replaces the old AngularJS `tgUserTimelineAttachment` directive in place, under the
 * same name, on the pre-existing `taigaUserTimeline` module.
 */
angular
    .module("taigaUserTimeline")
    .directive("tgUserTimelineAttachment", downgradeComponent({ component: UserTimelineAttachmentComponent }));
