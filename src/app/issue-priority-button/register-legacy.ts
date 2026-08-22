import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { IssuePriorityButtonComponent } from "./issue-priority-button.component";

/**
 * Replaces the old AngularJS `tgIssuePriorityButton` directive in place, under the same
 * name, on the pre-existing `taigaIssues` module.
 */
angular
    .module("taigaIssues")
    .directive("tgIssuePriorityButton", downgradeComponent({ component: IssuePriorityButtonComponent }));
