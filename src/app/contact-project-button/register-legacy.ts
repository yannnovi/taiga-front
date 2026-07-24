import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { ContactProjectButtonComponent } from "./contact-project-button.component";

/**
 * Replaces the old AngularJS `tgContactProjectButton` directive in place, under the same
 * name, on the pre-existing `taigaProjects` module.
 */
angular
    .module("taigaProjects")
    .directive("tgContactProjectButton", downgradeComponent({ component: ContactProjectButtonComponent }));
