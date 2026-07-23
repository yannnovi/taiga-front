import { Directive, ElementRef, Injector, Input } from "@angular/core";
import { UpgradeComponent } from "@angular/upgrade/static";

/**
 * Wraps the still-AngularJS `tgNotificationsList` directive
 * (app/modules/notifications/notifications-list/) - it instantiates its own separate
 * "Notifications" AngularJS controller instance internally (see notifications.component.ts
 * for why that's fine/pre-existing). None of these bindings are set by
 * notifications.component.html, matching the original notifications.jade usage.
 */
@Directive({ selector: "tg-notifications-list" })
export class TgNotificationsListUpgradedDirective extends UpgradeComponent {
    @Input() infiniteScrollContainer: any;
    @Input() infiniteScrollDistance: any;
    @Input() infiniteScrollDisabled: any;
    @Input() onlyUnread: any;

    constructor(elementRef: ElementRef, injector: Injector) {
        super("tgNotificationsList", elementRef, injector);
    }
}
