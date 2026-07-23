import { Directive, ElementRef, EventEmitter, Injector, Input, Output } from "@angular/core";
import { UpgradeComponent } from "@angular/upgrade/static";

/**
 * Wraps the still-AngularJS `tgDiscoverSearchBar` directive
 * (app/modules/discover/components/discover-search-bar/). Isolate scope bindings:
 * `q`/`filter` (two-way `=`, unused by discover-home so left unbound here, same as the
 * original template) and `onChange` (`&`, invoked as `onChange({filter, q})` - see
 * discover-search-bar.controller.coffee), surfaced here as an @Output emitting that same
 * `{filter, q}` object.
 */
@Directive({ selector: "tg-discover-search-bar" })
export class TgDiscoverSearchBarUpgradedDirective extends UpgradeComponent {
    @Input() q: any;
    @Input() filter: any;
    @Output() onChange = new EventEmitter<{ filter: string; q: string }>();

    constructor(elementRef: ElementRef, injector: Injector) {
        super("tgDiscoverSearchBar", elementRef, injector);
    }
}
