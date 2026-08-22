import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { LightboxCreateBulkUserstoriesComponent } from "./lightbox-create-bulk-userstories.component";

/**
 * Replaces the old AngularJS `tgLbCreateBulkUserstories` directive in place, under the
 * same name, on the pre-existing `taigaCommon` module.
 */
angular
    .module("taigaCommon")
    .directive(
        "tgLbCreateBulkUserstories",
        downgradeComponent({ component: LightboxCreateBulkUserstoriesComponent }),
    );
