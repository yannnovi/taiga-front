import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { VoteButtonComponent } from "./vote-button.component";

/**
 * Replaces the old AngularJS `tgVoteButton` directive in place, under the same name, on
 * the pre-existing `taigaComponents` module.
 */
angular
    .module("taigaComponents")
    .directive("tgVoteButton", downgradeComponent({ component: VoteButtonComponent }));
