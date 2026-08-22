import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { IssueSeverityButtonComponent } from "./issue-severity-button.component";

/**
 * Replaces the old AngularJS `tgIssueSeverityButton` directive in place, under the same
 * name, on the pre-existing `taigaIssues` module.
 */
angular
    .module("taigaIssues")
    .directive("tgIssueSeverityButton", downgradeComponent({ component: IssueSeverityButtonComponent }));
