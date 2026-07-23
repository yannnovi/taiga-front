import { Directive, ElementRef, Injector } from "@angular/core";
import { UpgradeComponent } from "@angular/upgrade/static";

/**
 * Wraps the still-AngularJS `tgHomeProjectList` directive
 * (app/modules/home/projects/home-project-list.directive.coffee) so it can be used from
 * an Angular template. No inputs/outputs: isolate scope, no bindings.
 */
@Directive({ selector: "tg-home-project-list" })
export class TgHomeProjectListUpgradedDirective extends UpgradeComponent {
    constructor(elementRef: ElementRef, injector: Injector) {
        super("tgHomeProjectList", elementRef, injector);
    }
}
