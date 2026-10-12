import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { ProjectTagsComponent } from "./project-tags.component";

/**
 * Replaces the old AngularJS `tgProjectTags` directive (and the `ProjectTagsController` it
 * was paired with) under the same name, on the pre-existing `taigaAdmin` module - now an
 * element rather than an attribute, since downgraded components always compile with
 * `restrict: 'E'`.
 */
angular.module("taigaAdmin").directive("tgProjectTags", downgradeComponent({ component: ProjectTagsComponent }));
