import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { AssignSprintToIssueButtonComponent } from "./assign-sprint-to-issue-button.component";

/** Replaces `tgAssignSprintToIssueButton` (issue detail sidebar), same name. */
angular
    .module("taigaIssues")
    .directive("tgAssignSprintToIssueButton", downgradeComponent({ component: AssignSprintToIssueButtonComponent }));
