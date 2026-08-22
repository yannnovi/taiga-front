import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { LightboxCreateEditSprintComponent } from "./lightbox-create-edit-sprint.component";

/**
 * Replaces the old AngularJS `tgLbCreateEditSprint` directive in place, under the same
 * name, on the pre-existing `taigaBacklog` module.
 */
angular
    .module("taigaBacklog")
    .directive(
        "tgLbCreateEditSprint",
        downgradeComponent({ component: LightboxCreateEditSprintComponent }),
    );
