import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { TribeButtonComponent } from "./tribe-button.component";

/**
 * Replaces the old AngularJS `tgTribeButton` directive in place, under the same name, on
 * the pre-existing `taigaComponents` module.
 */
angular
    .module("taigaComponents")
    .directive("tgTribeButton", downgradeComponent({ component: TribeButtonComponent }));
