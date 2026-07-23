import { Directive, ElementRef, Injector } from "@angular/core";
import { UpgradeComponent } from "@angular/upgrade/static";

/**
 * Wraps the still-AngularJS `tgMostLiked` directive
 * (app/modules/discover/components/most-liked/). No inputs/outputs: isolate scope, no
 * bindings. Its own nested children (tg-discover-home-order-by, tg-highlighted) stay
 * entirely within AngularJS's own compilation of this directive's template - no separate
 * wrapper needed for those.
 */
@Directive({ selector: "tg-most-liked" })
export class TgMostLikedUpgradedDirective extends UpgradeComponent {
    constructor(elementRef: ElementRef, injector: Injector) {
        super("tgMostLiked", elementRef, injector);
    }
}
