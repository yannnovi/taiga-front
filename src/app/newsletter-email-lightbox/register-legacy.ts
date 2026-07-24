import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { NewsletterEmailLightboxComponent } from "./newsletter-email-lightbox.component";

/**
 * Replaces the old AngularJS `tgNewsletterEmailLightbox` directive in place, under the
 * same name, on the pre-existing `taigaProjects` module.
 */
angular
    .module("taigaProjects")
    .directive("tgNewsletterEmailLightbox", downgradeComponent({ component: NewsletterEmailLightboxComponent }));
