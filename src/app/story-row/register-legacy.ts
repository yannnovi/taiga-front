import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { StoryRowComponent } from "./story-row.component";

/**
 * Replaces the old AngularJS `tgStoryRow` directive in place, under the same name, on the
 * pre-existing `taigaEpics` module.
 */
angular.module("taigaEpics").directive("tgStoryRow", downgradeComponent({ component: StoryRowComponent }));
