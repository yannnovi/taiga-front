import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { SingleMemberComponent } from "./single-member.component";

/**
 * Replaces the old AngularJS `tgSingleMember` directive in place, under the same name, on
 * the pre-existing `taigaProjects` module.
 */
angular.module("taigaProjects").directive("tgSingleMember", downgradeComponent({ component: SingleMemberComponent }));
