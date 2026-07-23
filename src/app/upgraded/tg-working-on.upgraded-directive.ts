import { Directive, ElementRef, Injector } from "@angular/core";
import { UpgradeComponent } from "@angular/upgrade/static";

/**
 * Wraps the still-AngularJS `tgWorkingOn` directive (app/modules/home/working-on/) so it
 * can be used from an Angular template. No inputs/outputs: the original directive has an
 * isolate scope with no bindings, it reads everything from injected services.
 */
@Directive({ selector: "tg-working-on" })
export class TgWorkingOnUpgradedDirective extends UpgradeComponent {
    constructor(elementRef: ElementRef, injector: Injector) {
        super("tgWorkingOn", elementRef, injector);
    }
}
