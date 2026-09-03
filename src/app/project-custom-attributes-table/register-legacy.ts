import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { ProjectCustomAttributesTableComponent } from "./project-custom-attributes-table.component";

/**
 * Registers the custom-attributes admin table on the pre-existing `taigaAdmin` module -
 * replaces the AngularJS `tgProjectCustomAttributes` directive/`ProjectCustomAttributesController`
 * (app/coffee/modules/admin/project-profile.coffee).
 */
angular
    .module("taigaAdmin")
    .directive(
        "tgProjectCustomAttributesTable",
        downgradeComponent({ component: ProjectCustomAttributesTableComponent }),
    );
