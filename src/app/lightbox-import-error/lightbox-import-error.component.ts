import { Component, ElementRef, Inject, Input } from "@angular/core";
import { AJS_LIGHTBOX_SERVICE } from "../shared/ajs-tokens";

declare const $: any;
declare const window: any;

/**
 * Angular replacement for the AngularJS `tgLbImportError` directive
 * (app/modules/projects/create/import/), downgraded in place under the same name - shown
 * when a project import hits a plan restriction. The original had no `scope:` at all (ambient
 * scope), but its one real caller (`import-project.service.coffee`'s
 * `lightboxFactory.create('tg-lb-import-error', {...}, restrictionError)`) always passes the
 * same fixed shape (`{key, values: {max_memberships, members}}`), so that's replicated here
 * as two plain `@Input()`s rather than an ambient-scope refactor.
 *
 * `tg-lightbox-close` (bare, no `on-close`) relies on the generic `.lightbox` class-based
 * click delegation, same as other lightboxes. The original's `link` called
 * `lightboxService.open(el)` directly, replicated in the constructor.
 */
@Component({
    selector: "tg-lb-import-error",
    templateUrl: "./lightbox-import-error.component.html",
})
export class LightboxImportErrorComponent {
    @Input() key: string;
    @Input() values: { max_memberships: number; members: number };

    assetPath = window._version;

    constructor(
        private elementRef: ElementRef,
        @Inject(AJS_LIGHTBOX_SERVICE) private lightboxService: any,
    ) {
        this.lightboxService.open($(this.elementRef.nativeElement));
    }

    close(): void {
        this.lightboxService.close($(this.elementRef.nativeElement));
    }
}
