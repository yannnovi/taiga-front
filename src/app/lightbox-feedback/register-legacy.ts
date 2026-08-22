import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { LightboxFeedbackComponent } from "./lightbox-feedback.component";

/**
 * Replaces the old AngularJS `tgLbFeedback` directive in place, under the same name, on
 * the pre-existing `taigaFeedback` module.
 */
angular
    .module("taigaFeedback")
    .directive("tgLbFeedback", downgradeComponent({ component: LightboxFeedbackComponent }));
