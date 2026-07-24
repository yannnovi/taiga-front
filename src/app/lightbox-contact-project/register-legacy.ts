import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { LightboxContactProjectComponent } from "./lightbox-contact-project.component";

/**
 * Replaces the old AngularJS `tgLbContactProject` directive in place, under the same name,
 * on the pre-existing `taigaProjects` module.
 */
angular
    .module("taigaProjects")
    .directive("tgLbContactProject", downgradeComponent({ component: LightboxContactProjectComponent }));
