import { Component, Inject, Input } from "@angular/core";
import { AJS_CONFIRM, AJS_WATCH_PROJECT_BUTTON_SERVICE } from "../shared/ajs-tokens";

declare const window: any;

/**
 * Angular replacement for the AngularJS `tgWatchProjectButton` directive
 * (app/modules/projects/components/watch-project-button/), downgraded in place under the
 * same name. Same `tg-loading` replication as `like-project-button`.
 */
@Component({
    selector: "tg-watch-project-button",
    templateUrl: "./watch-project-button.component.html",
})
export class WatchProjectButtonComponent {
    @Input() project: any;

    showWatchOptions = false;
    loading = false;
    spinnerSrc = `${window._version}/svg/spinner-circle.svg`;

    constructor(
        @Inject(AJS_CONFIRM) private confirm: any,
        @Inject(AJS_WATCH_PROJECT_BUTTON_SERVICE) private watchButtonService: any,
    ) {}

    toggleWatcherOptions(): void {
        this.showWatchOptions = !this.showWatchOptions;
    }

    closeWatcherOptions(): void {
        this.showWatchOptions = false;
    }

    watch(notifyLevel: number): void {
        if (notifyLevel === this.project.get("notify_level")) {
            return;
        }

        this.loading = true;
        this.closeWatcherOptions();

        this.watchButtonService
            .watch(this.project.get("id"), notifyLevel)
            .catch(() => this.confirm.notify("error"))
            .finally(() => {
                this.loading = false;
            });
    }

    unwatch(): void {
        this.loading = true;
        this.closeWatcherOptions();

        this.watchButtonService
            .unwatch(this.project.get("id"))
            .catch(() => this.confirm.notify("error"))
            .finally(() => {
                this.loading = false;
            });
    }
}
