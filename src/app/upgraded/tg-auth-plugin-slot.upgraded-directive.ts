import { Directive, ElementRef, Injector, Input } from "@angular/core";
import { UpgradeComponent } from "@angular/upgrade/static";

/**
 * Wraps the small AngularJS `tgAuthPluginSlot` directive
 * (app/coffee/modules/auth.coffee) - a bridge purpose-built during the auth.coffee
 * migration so contrib plugins of type "auth" (external, `$rootScope.authPlugins`) keep
 * working from Angular templates: their `plugin.template` is only meaningful to
 * AngularJS's `$compile` (`ng-include`), which Angular has no equivalent for. Isolate
 * scope binding: `plugin` (two-way `=`).
 */
@Directive({ selector: "tg-auth-plugin-slot" })
export class TgAuthPluginSlotUpgradedDirective extends UpgradeComponent {
    @Input() plugin: any;

    constructor(elementRef: ElementRef, injector: Injector) {
        super("tgAuthPluginSlot", elementRef, injector);
    }
}
