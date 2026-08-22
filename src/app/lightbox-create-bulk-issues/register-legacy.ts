import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { LightboxCreateBulkIssuesComponent } from "./lightbox-create-bulk-issues.component";

/**
 * Replaces the old AngularJS `tgLbCreateBulkIssues` directive in place, under the same
 * name, on the pre-existing `taigaIssues` module.
 */
angular
    .module("taigaIssues")
    .directive("tgLbCreateBulkIssues", downgradeComponent({ component: LightboxCreateBulkIssuesComponent }));
