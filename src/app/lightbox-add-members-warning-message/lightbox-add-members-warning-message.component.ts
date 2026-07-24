import { Component, Input } from "@angular/core";

/**
 * Angular replacement for the AngularJS `tgLightboxAddMembersWarningMessage` directive
 * (app/coffee/modules/admin/lightboxes.coffee), downgraded in place under the same name -
 * a template-only directive (no controller at all).
 */
@Component({
    selector: "tg-lightbox-add-members-warning-message",
    templateUrl: "./lightbox-add-members-warning-message.component.html",
})
export class LightboxAddMembersWarningMessageComponent {
    @Input() project: any;
}
