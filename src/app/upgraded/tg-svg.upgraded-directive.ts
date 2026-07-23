import { Directive, ElementRef, Injector, Input } from "@angular/core";
import { UpgradeComponent } from "@angular/upgrade/static";

/**
 * Wraps the still-AngularJS `tgSvg` directive (app/coffee/modules/common.coffee) - the
 * app-wide SVG icon primitive, used in nearly every template. No service dependencies,
 * pure presentational bindings: `svgIcon`/`svgTitle`/`svgTitleTranslate` (`@`, attribute
 * strings) and `svgTitleTranslateValues`/`svgFill` (`=`, two-way).
 */
@Directive({ selector: "tg-svg" })
export class TgSvgUpgradedDirective extends UpgradeComponent {
    @Input() svgIcon: any;
    @Input() svgTitle: any;
    @Input() svgTitleTranslate: any;
    @Input() svgTitleTranslateValues: any;
    @Input() svgFill: any;

    constructor(elementRef: ElementRef, injector: Injector) {
        super("tgSvg", elementRef, injector);
    }
}
