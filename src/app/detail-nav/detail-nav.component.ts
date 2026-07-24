import { Component, Inject, Input, OnChanges } from "@angular/core";
import { AJS_NAV_URLS, AJS_RESOURCES } from "../shared/ajs-tokens";

/**
 * Angular replacement for the AngularJS `tgDetailNav` directive
 * (app/modules/components/detail/nav/), downgraded in place under the same name.
 *
 * Bug fixed while porting, same as wip-limit-selector: the original controller injected
 * `"$tgResources"`, which isn't registered anywhere (only the unprefixed `tgResources`
 * is) - used the real service name instead.
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
        @Inject(AJS_RESOURCES) private rs: any,
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
