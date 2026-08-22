import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { DueDatePopoverComponent } from "./due-date-popover.component";

/**
 * Replaces the old AngularJS `tgDueDatePopover` directive in place, under the same name,
 * on the pre-existing `taigaComponents` module.
 */
angular
    .module("taigaComponents")
    .directive("tgDueDatePopover", downgradeComponent({ component: DueDatePopoverComponent }));
