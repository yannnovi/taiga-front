import { Component, Inject } from "@angular/core";
import { AJS_CURRENT_USER_SERVICE, AJS_LOCATION, AJS_NAV_URLS } from "../shared/ajs-tokens";

/**
 * Angular replacement for the old AngularJS `Home` route controller
 * (app/modules/home/home.controller.coffee + home.jade). Downgraded to a `tg-home`
 * AngularJS directive in register-legacy.ts so it can be used from the ngRoute route
 * definition (app/coffee/app.coffee) exactly like any other AngularJS template.
 *
 * `tgHomeService` (the duties/work-in-progress data) stays in AngularJS: it's actually
 * consumed by the sibling `tg-working-on` directive/controller, not by this component -
 * migrating it isn't in scope of this pass.
 */
@Component({
    selector: "tg-home",
    templateUrl: "./home.component.html",
})
export class HomeComponent {
    constructor(
        @Inject(AJS_CURRENT_USER_SERVICE) currentUserService: any,
        @Inject(AJS_NAV_URLS) navUrls: any,
        @Inject(AJS_LOCATION) location: any,
    ) {
        if (!currentUserService.getUser()) {
            location.path(navUrls.resolve("discover"));
        }
    }
}
