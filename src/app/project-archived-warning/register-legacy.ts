import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { ProjectArchivedWarningComponent } from "./project-archived-warning.component";

/**
 * Replaces the old AngularJS `tgProjectArchivedWarning` directive in place, under the
 * same name, on the pre-existing `taigaComponents` module.
 */
angular
    .module("taigaComponents")
    .directive(
        "tgProjectArchivedWarning",
        downgradeComponent({ component: ProjectArchivedWarningComponent }),
    );
