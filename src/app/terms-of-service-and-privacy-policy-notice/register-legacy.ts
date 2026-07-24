import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { TermsOfServiceAndPrivacyPolicyNoticeComponent } from "./terms-of-service-and-privacy-policy-notice.component";

/**
 * Replaces the old AngularJS `tgTermsOfServiceAndPrivacyPolicyNotice` directive in place,
 * under the same name, on the pre-existing `taigaComponents` module.
 */
angular
    .module("taigaComponents")
    .directive(
        "tgTermsOfServiceAndPrivacyPolicyNotice",
        downgradeComponent({ component: TermsOfServiceAndPrivacyPolicyNoticeComponent }),
    );
