import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { RelatedTasksComponent } from "./related-tasks.component";

/**
 * Replaces the user story detail's related tasks block (`includes/modules/related-tasks.jade`
 * and the whole `taigaRelatedTasks` module - `tgRelatedTasks`, `tgRelatedTaskRow`,
 * `tgRelatedTaskCreateForm`, `tgRelatedTaskCreateButton`,
 * `tgRelatedTaskAssignedToInlineEdition` - plus `tgRelatedTaskStatus` and `tgTasksSortable`).
 */
angular
    .module("taigaUserStories")
    .directive("tgRelatedTasksSection", downgradeComponent({ component: RelatedTasksComponent }));
