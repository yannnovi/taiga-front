import { Component, Inject, OnInit } from "@angular/core";
import { AJS_CONFIG, AJS_NAV_URLS, AJS_ROUTE_PARAMS } from "../shared/ajs-tokens";

/**
 * Angular replacement for the AngularJS `tgPublicRegisterMessage` directive
 * (app/coffee/modules/auth.coffee), downgraded in place under the same name. The original
 * used `template: templateFn` (a function called once at compile time returning a static
 * HTML string built via a lo-dash/underscore template - `$tgTemplate.get(name, true)`,
 * the `true` flag meaning "not an Angular template, an underscore one") rather than normal
 * reactive AngularJS bindings - ported here as a plain `*ngIf` + computed `url`.
 */
@Component({
    selector: "tg-public-register-message",
    templateUrl: "./public-register-message.component.html",
})
export class PublicRegisterMessageComponent implements OnInit {
    publicRegisterEnabled = false;
    url = "";

    constructor(
        @Inject(AJS_CONFIG) private config: any,
        @Inject(AJS_NAV_URLS) private navUrls: any,
        @Inject(AJS_ROUTE_PARAMS) private routeParams: any,
    ) {}

    ngOnInit(): void {
        this.publicRegisterEnabled = this.config.get("publicRegisterEnabled");

        if (!this.publicRegisterEnabled) {
            return;
        }

        this.url = this.navUrls.resolve("register");

        if (this.routeParams["force_next"]) {
            const nextUrl = encodeURIComponent(this.routeParams["force_next"]);
            this.url += `?next=${nextUrl}`;
        }
    }
}
