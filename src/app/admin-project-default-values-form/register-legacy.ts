import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { AdminProjectDefaultValuesFormComponent } from "./admin-project-default-values-form.component";

/**
 * Registers the new project-default-values form component on the pre-existing `taigaAdmin`
 * module, replacing the AngularJS `tgProjectDefaultValues` directive's form content and
 * submit behaviour (app/coffee/modules/admin/project-profile.coffee).
 */
angular
    .module("taigaAdmin")
    .directive(
        "tgAdminProjectDefaultValuesForm",
        downgradeComponent({ component: AdminProjectDefaultValuesFormComponent }),
    );
