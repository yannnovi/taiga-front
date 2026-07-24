import { Component, Inject, Input, OnChanges } from "@angular/core";
import { AJS_NAV_URLS, AJS_TG_RESOURCES } from "../shared/ajs-tokens";

/**
 * Angular replacement for the AngularJS `tgDetailNav` directive
 * (app/modules/components/detail/nav/), downgraded in place under the same name.
 *
 * Correction: an earlier version of this file "fixed" the original's `"$tgResources"`
 * injection to the unprefixed `tgResources`, believing it was a typo for a service that
 * doesn't exist. It isn't - `$tgResources` (with the `$`) is a real, separate, fully
 * populated resources service (app/coffee/modules/resources.coffee), distinct from the
 * smaller `tgResources` aggregator - and it's the one with `getQueryParams`/`getBacklog`.
 * See ajs-tokens.ts for the full explanation. Fixed to use AJS_TG_RESOURCES.
 */
@Component({
    selector: "tg-detail-nav",
    templateUrl: "./detail-nav.component.html",
})
export class DetailNavComponent implements OnChanges {
    @Input() item: any;

    previousUrl: string | null = null;
    nextUrl: string | null = null;

    constructor(
        @Inject(AJS_NAV_URLS) private navUrls: any,
        @Inject(AJS_TG_RESOURCES) private rs: any,
    ) {}

    ngOnChanges(): void {
        if (this.item) {
            this.checkNav();
        }
    }

    private checkNav(): void {
        const params = this.rs.userstories.getQueryParams(this.item.project_extra_info.id);
        const noMilestone = params.milestone === "null";

        let neighbors = this.item.neighbors;

        this.previousUrl = null;
        this.nextUrl = null;

        if (noMilestone) {
            const uss = this.rs.userstories.getBacklog(this.item.project_extra_info.id);
            const index = uss.findIndex((ref: any) => ref === this.item.ref);

            if (index !== -1) {
                neighbors = {
                    previous: { ref: uss[index - 1] },
                    next: { ref: uss[index + 1] },
                };
            }
        }

        if (neighbors.previous?.ref != null) {
            const ctx = {
                project: this.item.project_extra_info.slug,
                ref: neighbors.previous.ref,
            };
            this.previousUrl = this.navUrls.resolve(`project-${this.item._name}-detail`, ctx);
        }

        if (neighbors.next?.ref != null) {
            const ctx = {
                project: this.item.project_extra_info.slug,
                ref: neighbors.next.ref,
            };
            this.nextUrl = this.navUrls.resolve(`project-${this.item._name}-detail`, ctx);
        }
    }
}
