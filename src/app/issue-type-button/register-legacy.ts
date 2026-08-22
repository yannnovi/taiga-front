import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { IssueTypeButtonComponent } from "./issue-type-button.component";

/**
 * Replaces the old AngularJS `tgIssueTypeButton` directive in place, under the same name,
 * on the pre-existing `taigaIssues` module.
 */
angular
    .module("taigaIssues")
    .directive("tgIssueTypeButton", downgradeComponent({ component: IssueTypeButtonComponent }));
