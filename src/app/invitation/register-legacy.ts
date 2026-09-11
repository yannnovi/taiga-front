import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { InvitationComponent } from "./invitation.component";

/**
 * Replaces the old AngularJS `tgInvitation` directive in place, under the same name, on
 * the pre-existing `taigaAuth` module - unlike its siblings in this sub-project, no rename
 * was needed here (the old name was never ambiguous with an element-vs-attribute clash
 * elsewhere).
 */
angular.module("taigaAuth").directive("tgInvitation", downgradeComponent({ component: InvitationComponent }));
