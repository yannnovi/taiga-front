import { Component, ElementRef, Inject } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { AJS_LIGHTBOX_SERVICE, AJS_NAV_URLS, AJS_PROJECT_SERVICE, AJS_ROUTE, AJS_TG_LOCATION } from "../shared/ajs-tokens";
import { FormErrorMessageService } from "../shared/form-error-message.service";

declare const $: any;

/**
 * Angular replacement for the AngularJS `tgSearchBox` directive
 * (app/coffee/modules/search.coffee), downgraded in place under the same name - opened
 * dynamically via `lightboxFactory.create("tg-search-box", {...})`
 * (project-menu.controller.coffee), same instantiate-on-open pattern as `tgLbFeedback`, no
 * data passed through `create()` at all (the project is read directly off
 * `tgProjectService`, same as the original's `link` function did).
 *
 * Submitting doesn't call a resource/repo - it navigates to the "project-search" route
 * with the typed text as a query param and reloads it (`$route.reload()`), exactly like
 * the original. Routing itself is intentionally left untouched (still AngularJS's
 * `$location`/`$route`), consistent with this whole migration never touching routing.
 */
@Component({
    selector: "tg-search-box",
    templateUrl: "./lightbox-search-box.component.html",
})
export class LightboxSearchBoxComponent {
    form = new FormGroup({
        text: new FormControl("", Validators.required),
    });

    submitting = false;

    constructor(
        private elementRef: ElementRef,
        @Inject(AJS_LIGHTBOX_SERVICE) private lightboxService: any,
        @Inject(AJS_PROJECT_SERVICE) private projectService: any,
        @Inject(AJS_NAV_URLS) private navUrls: any,
        @Inject(AJS_TG_LOCATION) private location: any,
        @Inject(AJS_ROUTE) private route: any,
        public errors: FormErrorMessageService,
    ) {
        this.lightboxService.open($(this.elementRef.nativeElement)).then(() => {
            $(this.elementRef.nativeElement).find("#search-text").focus();
        });
    }

    close(): void {
        this.lightboxService.close($(this.elementRef.nativeElement));
    }

    submit(): void {
        if (this.submitting || this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.submitting = true;

        const text = this.form.value.text;
        const url = this.navUrls.resolve("project-search", { project: this.projectService.project.get("slug") });

        this.close();

        this.location.search("text", text).path(url);
        this.route.reload();
    }
}
