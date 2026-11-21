import { Directive, ElementRef, Injector, Input, OnInit, SimpleChange, SimpleChanges } from "@angular/core";
import { UpgradeComponent } from "@angular/upgrade/static";

/** `@` (string) bindings of `tgSvg` that templates write as static kebab-case attributes. */
const STATIC_STRING_ATTRS: Record<string, string> = {
    svgIcon: "svg-icon",
    svgTitle: "svg-title",
    svgTitleTranslate: "svg-title-translate",
};

/**
 * Wraps the still-AngularJS `tgSvg` directive (app/coffee/modules/common.coffee) - the
 * app-wide SVG icon primitive, used in nearly every template. No service dependencies,
 * pure presentational bindings: `svgIcon`/`svgTitle`/`svgTitleTranslate` (`@`, attribute
 * strings) and `svgTitleTranslateValues`/`svgFill` (`=`, two-way).
 *
 * Angular templates throughout the migration write the AngularJS form
 * `<tg-svg svg-icon="icon-add">`. `UpgradeComponent` only forwards Angular *inputs*, and a
 * static `svg-icon` attribute doesn't set the `svgIcon` input (only `svgIcon="..."` or
 * `[svgIcon]` would) - so every such icon rendered `<use href="#">`, i.e. nothing. Rather
 * than rewriting ~230 call sites, `ngOnInit` reads those static kebab-case attributes and
 * feeds them in as initial changes, unless the matching input was actually bound.
 */
@Directive({ selector: "tg-svg" })
export class TgSvgUpgradedDirective extends UpgradeComponent implements OnInit {
    @Input() svgIcon: any;
    @Input() svgTitle: any;
    @Input() svgTitleTranslate: any;
    @Input() svgTitleTranslateValues: any;
    @Input() svgFill: any;

    constructor(
        private hostRef: ElementRef<HTMLElement>,
        injector: Injector,
    ) {
        super("tgSvg", hostRef, injector);
    }

    override ngOnInit(): void {
        const self = this as any;
        const pending: SimpleChanges = { ...(self.pendingChanges || {}) };
        let found = false;

        for (const [prop, attr] of Object.entries(STATIC_STRING_ATTRS)) {
            const value = this.hostRef.nativeElement.getAttribute(attr);

            if (value !== null && self[prop] === undefined && !pending[prop]) {
                self[prop] = value;
                pending[prop] = new SimpleChange(undefined, value, true);
                found = true;
            }
        }

        if (found) {
            // UpgradeComponent forwards these to the AngularJS scope at the end of its own
            // ngOnInit (the same path as changes received before initialization).
            self.pendingChanges = pending;
        }

        super.ngOnInit();
    }
}
