import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { WatchProjectButtonComponent } from "./watch-project-button.component";

/**
 * Replaces the old AngularJS `tgWatchProjectButton` directive in place, under the same
 * name, on the pre-existing `taigaProjects` module.
 */
angular
    .module("taigaProjects")
    .directive("tgWatchProjectButton", downgradeComponent({ component: WatchProjectButtonComponent }));
