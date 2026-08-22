import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { AdminProjectProfileFormComponent } from "./admin-project-profile-form.component";

/**
 * Registers the new project-profile form component on the pre-existing `taigaAdmin`
 * module, replacing the AngularJS `tgProjectProfile` directive's form content and submit
 * behaviour (app/coffee/modules/admin/project-profile.coffee).
 */
angular
    .module("taigaAdmin")
    .directive("tgAdminProjectProfileForm", downgradeComponent({ component: AdminProjectProfileFormComponent }));
