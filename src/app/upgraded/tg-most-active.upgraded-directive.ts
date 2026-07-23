import { Directive, ElementRef, Injector } from "@angular/core";
import { UpgradeComponent } from "@angular/upgrade/static";

/**
 * Wraps the still-AngularJS `tgMostActive` directive
 * (app/modules/discover/components/most-active/). No inputs/outputs: isolate scope, no
 * bindings. Same note as tg-most-liked re: its own nested children.
 */
@Directive({ selector: "tg-most-active" })
export class TgMostActiveUpgradedDirective extends UpgradeComponent {
    constructor(elementRef: ElementRef, injector: Injector) {
        super("tgMostActive", elementRef, injector);
    }
}
