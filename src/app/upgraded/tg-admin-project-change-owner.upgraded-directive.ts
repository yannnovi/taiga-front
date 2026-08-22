import { Directive, ElementRef, Injector, Input } from "@angular/core";
import { UpgradeComponent } from "@angular/upgrade/static";

/**
 * Wraps the still-AngularJS `tgAdminProjectChangeOwner` directive
 * (app/coffee/modules/admin/project-profile.coffee) - the "change owner" button shown on
 * the admin project profile form when the current user is the project owner. Isolate
 * scope bindings: `activeUsers`/`projectId`/`owner`/`members` (all two-way `=`).
 */
@Directive({ selector: "tg-admin-project-change-owner" })
export class TgAdminProjectChangeOwnerUpgradedDirective extends UpgradeComponent {
    @Input() activeUsers: any;
    @Input() projectId: any;
    @Input() owner: any;
    @Input() members: any;

    constructor(elementRef: ElementRef, injector: Injector) {
        super("tgAdminProjectChangeOwner", elementRef, injector);
    }
}
