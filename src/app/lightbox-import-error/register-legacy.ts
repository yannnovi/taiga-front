import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { LightboxImportErrorComponent } from "./lightbox-import-error.component";

/**
 * Replaces the old AngularJS `tgLbImportError` directive in place, under the same name,
 * on the pre-existing `taigaProjects` module.
 */
angular
    .module("taigaProjects")
    .directive("tgLbImportError", downgradeComponent({ component: LightboxImportErrorComponent }));
