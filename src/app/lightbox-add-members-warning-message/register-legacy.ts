import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { LightboxAddMembersWarningMessageComponent } from "./lightbox-add-members-warning-message.component";

/**
 * Replaces the old AngularJS `tgLightboxAddMembersWarningMessage` directive in place,
 * under the same name, on the pre-existing `taigaKanban` module (yes, `taigaKanban` -
 * that's where the original was registered despite being about project memberships).
 */
angular
    .module("taigaKanban")
    .directive(
        "tgLightboxAddMembersWarningMessage",
        downgradeComponent({ component: LightboxAddMembersWarningMessageComponent }),
    );
