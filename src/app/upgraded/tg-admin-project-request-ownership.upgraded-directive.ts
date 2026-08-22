import { Directive, ElementRef, Injector, Input } from "@angular/core";
import { UpgradeComponent } from "@angular/upgrade/static";

/**
 * Wraps the still-AngularJS `tgAdminProjectRequestOwnership` directive
 * (app/coffee/modules/admin/project-profile.coffee) - the "request ownership" button shown
 * on the admin project profile form when the current user isn't the project owner.
 * Isolate scope bindings: `canRequest`/`projectId`/`owner` (all two-way `=`).
 */
@Directive({ selector: "tg-admin-project-request-ownership" })
export class TgAdminProjectRequestOwnershipUpgradedDirective extends UpgradeComponent {
    @Input() canRequest: any;
    @Input() projectId: any;
    @Input() owner: any;

    constructor(elementRef: ElementRef, injector: Injector) {
        super("tgAdminProjectRequestOwnership", elementRef, injector);
    }
}
