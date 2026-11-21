import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { BacklogSprintsComponent } from "./backlog-sprints.component";

/**
 * Replaces the backlog sprint sidebar (`includes/modules/sprints.jade` and the
 * `tgBacklogSprint`/`tgBacklogSprintHeader`/`tgBacklogToggleClosedSprintsVisualization`/
 * `tgSprint` directives) on the pre-existing `taigaBacklog` module.
 */
angular
    .module("taigaBacklog")
    .directive("tgBacklogSprints", downgradeComponent({ component: BacklogSprintsComponent }));
