import { Component, Inject, Input, OnInit } from "@angular/core";
import { AJS_CONFIG, AJS_TG_LOCATION } from "../shared/ajs-tokens";

declare const window: any;

/**
 * Angular replacement for the AngularJS `tgTribeButton` directive
 * (app/modules/components/tribe-button/tribe-button.directive.coffee). Downgraded in
 * place under the same directive name. Its one caller (us-detail.jade, still AngularJS)
 * used plain `us-id="us.id"`/`project-slug="project.slug"` attributes - switched to
 * `bind-us-id`/`bind-project-slug` so the values are actually evaluated rather than
 * treated as literal interpolated strings (same gotcha as discover-home-order-by).
 */
@Component({
    selector: "tg-tribe-button",
    templateUrl: "./tribe-button.component.html",
})
export class TribeButtonComponent implements OnInit {
    @Input() usId: any;
    @Input() projectSlug: any;

    tribeHost = "";
    url = "";
    imgSrc = `${window._version}/images/tribe-logo.png`;

    constructor(
        @Inject(AJS_CONFIG) private config: any,
        @Inject(AJS_TG_LOCATION) private location: any,
    ) {}

    ngOnInit(): void {
        this.tribeHost = this.config.config.tribeHost;
        this.url = `${this.location.protocol()}://${this.location.host()}`;

        if (this.location.protocol() === "http" && this.location.port() !== 80) {
            this.url = `${this.url}:${this.location.port()}`;
        } else if (this.location.protocol() === "https" && this.location.port() !== 443) {
            this.url = `${this.url}:${this.location.port()}`;
        }
    }
}
