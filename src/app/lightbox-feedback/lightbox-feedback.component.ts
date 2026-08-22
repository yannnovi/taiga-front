import { Component, ElementRef, Inject } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { AJS_CONFIRM, AJS_LIGHTBOX_SERVICE, AJS_REPO } from "../shared/ajs-tokens";
import { FormErrorMessageService } from "../shared/form-error-message.service";

declare const $: any;

/**
 * Angular replacement for the AngularJS `tgLbFeedback` directive
 * (app/coffee/modules/feedback.coffee), downgraded in place under the same name - the
 * simplest of the checksley-validated lightboxes (isolate scope, one field), so the first
 * one migrated to `ReactiveFormsModule` (see MIGRATION_ROADMAP.md's checksley sub-project).
 *
 * `tgLightboxClose`'s generated markup (`<a class="close" ng-click="onClose()">`) is
 * inlined directly, same as other already-migrated lightboxes
 * (`LightboxImportErrorComponent` et al.) - it's a template-only AngularJS directive, not
 * something callable from an Angular template.
 *
 * The original's `debounce 2000` submit guard (`taiga.debounce`, a custom utility, not
 * lodash's) is replaced with a plain `submitting` flag - same effect (prevents a
 * double-submit within the request's lifetime), without pulling in a global utility for a
 * one-field form. `$tgLoading`'s compiled-template button overlay is likewise simplified to
 * `[disabled]="submitting"` - same precedent already used for `BacklogTableComponent`'s own
 * loading spinner.
 */
@Component({
    selector: "tg-lb-feedback",
    templateUrl: "./lightbox-feedback.component.html",
})
export class LightboxFeedbackComponent {
    form = new FormGroup({
        comment: new FormControl("", Validators.required),
    });

    submitting = false;

    constructor(
        private elementRef: ElementRef,
        @Inject(AJS_LIGHTBOX_SERVICE) private lightboxService: any,
        @Inject(AJS_REPO) private repo: any,
        @Inject(AJS_CONFIRM) private confirm: any,
        public errors: FormErrorMessageService,
    ) {
        this.lightboxService.open($(this.elementRef.nativeElement));
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

        this.repo.create("feedback", { comment: this.form.value.comment }).then(
            () => {
                this.submitting = false;
                this.close();
                this.confirm.notify("success", "\\o/ we'll be happy to read your");
            },
            () => {
                this.submitting = false;
                this.confirm.notify("error");
            },
        );
    }
}
