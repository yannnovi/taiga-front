import { Directive, ElementRef, Injector } from "@angular/core";
import { UpgradeComponent } from "@angular/upgrade/static";

/**
 * Wraps the still-AngularJS `tgFeaturedProjects` directive
 * (app/modules/discover/components/featured-projects/). No inputs/outputs: isolate scope,
 * no bindings.
 */
@Directive({ selector: "tg-featured-projects" })
export class TgFeaturedProjectsUpgradedDirective extends UpgradeComponent {
    constructor(elementRef: ElementRef, injector: Injector) {
        super("tgFeaturedProjects", elementRef, injector);
    }
}
