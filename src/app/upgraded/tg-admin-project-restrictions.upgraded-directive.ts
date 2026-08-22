import { Directive, ElementRef, Injector, Input } from "@angular/core";
import { UpgradeComponent } from "@angular/upgrade/static";

/**
 * Wraps the still-AngularJS `tgAdminProjectRestrictions` directive
 * (app/coffee/modules/admin/project-profile.coffee) - the project-privacy-restrictions
 * panel embedded in the admin project profile form. Isolate scope binding: `project`
 * (two-way `=`).
 */
@Directive({ selector: "tg-admin-project-restrictions" })
export class TgAdminProjectRestrictionsUpgradedDirective extends UpgradeComponent {
    @Input() project: any;

    constructor(elementRef: ElementRef, injector: Injector) {
        super("tgAdminProjectRestrictions", elementRef, injector);
    }
}
