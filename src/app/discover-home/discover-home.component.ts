import { Component, Inject } from "@angular/core";
import { AJS_APP_META_SERVICE, AJS_TG_LOCATION, AJS_NAV_URLS, AJS_TRANSLATE } from "../shared/ajs-tokens";

/**
 * Angular replacement for the old AngularJS `DiscoverHome` route controller
 * (app/modules/discover/discover-home/discover-home.controller.coffee + .jade).
 * Downgraded to a `tg-discover-home` AngularJS directive in register-legacy.ts so it can
 * be used from the ngRoute route definition (app/coffee/app.coffee) exactly like any
 * other AngularJS template.
 *
 * `tgDiscoverProjectsService` (used by the still-AngularJS children: search bar,
 * featured/most-liked/most-active projects) stays in AngularJS - it's confirmed isolated
 * to the discover module, but this component doesn't need it directly.
 */
@Component({
    selector: "tg-discover-home",
    templateUrl: "./discover-home.component.html",
})
export class DiscoverHomeComponent {
    constructor(
        @Inject(AJS_TG_LOCATION) private location: any,
        @Inject(AJS_NAV_URLS) private navUrls: any,
        @Inject(AJS_APP_META_SERVICE) appMetaService: any,
        @Inject(AJS_TRANSLATE) translate: any,
    ) {
        const title = translate.instant("DISCOVER.PAGE_TITLE");
        const description = translate.instant("DISCOVER.PAGE_DESCRIPTION");
        appMetaService.setAll(title, description);
    }

    onSubmit(q: string): void {
        const url = this.navUrls.resolve("discover-search");
        this.location.search("text", q).path(url);
    }
}
