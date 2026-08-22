import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { AdminProjectModulesFormComponent } from "./admin-project-modules-form.component";

/**
 * Registers the new project-modules form component on the pre-existing `taigaAdmin`
 * module, replacing the AngularJS `tgProjectModules` directive's form content and submit
 * behaviour (app/coffee/modules/admin/project-profile.coffee).
 */
angular
    .module("taigaAdmin")
    .directive("tgAdminProjectModulesForm", downgradeComponent({ component: AdminProjectModulesFormComponent }));
