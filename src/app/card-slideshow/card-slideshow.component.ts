import { Component, Input } from "@angular/core";

declare const window: any;

/**
 * Angular replacement for the AngularJS `tgCardSlideshow` directive
 * (app/modules/components/card-slideshow/), downgraded in place under the same name -
 * part of the `tg-card` migration (see MIGRATION_ROADMAP.md, dragula Phase 2). Small,
 * self-contained isolate-scope directive, migrated on its own so `CardComponent` can use
 * it natively rather than needing an `UpgradeComponent` wrapper.
 *
 * `tg-preload-image` (transclude-based, spinner-until-loaded) replicated the same way as
 * `AttachmentsPreviewComponent` - a `loading` flag toggled by the native `<img>` `(load)`
 * event.
 */
@Component({
    selector: "tg-card-slideshow",
    templateUrl: "./card-slideshow.component.html",
})
export class CardSlideshowComponent {
    @Input() images: any;

    index = 0;
    loading = true;
    spinnerSrc = `${window._version}/svg/spinner-circle.svg`;

    next(): void {
        this.index++;

        if (this.index >= this.images.size) {
            this.index = 0;
        }

        this.loading = true;
    }

    previous(): void {
        this.index--;

        if (this.index < 0) {
            this.index = this.images.size - 1;
        }

        this.loading = true;
    }

    onImageLoad(): void {
        this.loading = false;
    }
}
