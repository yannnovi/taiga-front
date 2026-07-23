import { Component, Inject } from "@angular/core";
import { AJS_LIVE_ANNOUNCEMENT_SERVICE } from "../shared/ajs-tokens";

declare const window: any;

/**
 * Angular replacement for the AngularJS `tgLiveAnnouncement` directive
 * (app/modules/components/live-announcement/). Downgraded in place under the same
 * directive name. Rendered once at the app shell level (app/index.jade, outside
 * `ng-view`), same as `tg-navigation-bar`/`tg-legacy` already are - AngularJS's own
 * bootstrap (via UpgradeModule) $compiles the whole document.body once, so a downgraded
 * component sitting directly in the static shell markup works the same as any native
 * AngularJS directive there.
 *
 * `open`/`title`/`desc` are getters delegating straight to `tgLiveAnnouncementService`
 * (a plain mutable object, not an Observable) - same as the original's
 * `Object.defineProperties` getters. zone.js patches enough of the app's async APIs that
 * Angular's change detection re-reads these on essentially every tick, so this reflects
 * updates the same way the original scope-based bindings did.
 */
@Component({
    selector: "tg-live-announcement",
    templateUrl: "./live-announcement.component.html",
})
export class LiveAnnouncementComponent {
    imgSrc = `${window._version}/images/notification-decoration.png`;

    constructor(@Inject(AJS_LIVE_ANNOUNCEMENT_SERVICE) private liveAnnouncementService: any) {}

    get open(): boolean {
        return this.liveAnnouncementService.open;
    }

    get title(): string {
        return this.liveAnnouncementService.title;
    }

    get desc(): string {
        return this.liveAnnouncementService.desc;
    }

    close(): void {
        this.liveAnnouncementService.open = false;
    }
}
