import { Component, ElementRef, Inject, OnDestroy } from "@angular/core";
import { FormControl, FormGroup } from "@angular/forms";
import { linewidthValidator } from "../shared/checksley-validators";
import { AJS_CONFIRM, AJS_LIGHTBOX_SERVICE, AJS_MODEL, AJS_ROOT_SCOPE, AJS_TG_RESOURCES } from "../shared/ajs-tokens";
import { FormErrorMessageService } from "../shared/form-error-message.service";

declare const $: any;

/**
 * Angular replacement for the AngularJS `tgLbCreateBulkIssues` directive
 * (app/coffee/modules/issues/lightboxes.coffee), downgraded in place under the same name.
 *
 * Unlike `tgLbFeedback`, the original had no isolate scope at all (ambient, `{link:
 * link}`) - but it never actually *read* anything from that ambient scope beyond what
 * the `issueform:bulk` broadcast itself carries (`projectId`, `milestoneId`), so it ports
 * cleanly to a real component with no bindings: it listens for that same broadcast
 * (`AJS_ROOT_SCOPE`) to open itself and capture the ids, instead of relying on `$scope.new`
 * being set by the broadcast handler.  Placed unchanged, with no `bind-x` attributes,
 * in both `issues.jade` and `taskboard.jade` (its two original mount points).
 *
 * `data-linewidth="200"` on the original's bulk textarea is the first real exercise of
 * `linewidthValidator` (`checksley-validators.ts`) outside the validators file itself.
 */
@Component({
    selector: "tg-lb-create-bulk-issues",
    templateUrl: "./lightbox-create-bulk-issues.component.html",
})
export class LightboxCreateBulkIssuesComponent implements OnDestroy {
    form = new FormGroup({
        bulk: new FormControl("", linewidthValidator(200)),
    });

    submitting = false;

    private projectId: any;
    private milestoneId: any;
    private unwatch: () => void;

    constructor(
        private elementRef: ElementRef,
        @Inject(AJS_LIGHTBOX_SERVICE) private lightboxService: any,
        @Inject(AJS_TG_RESOURCES) private rs: any,
        @Inject(AJS_CONFIRM) private confirm: any,
        @Inject(AJS_ROOT_SCOPE) private rootScope: any,
        @Inject(AJS_MODEL) private model: any,
        public errors: FormErrorMessageService,
    ) {
        this.unwatch = this.rootScope.$on(
            "issueform:bulk",
            (event: any, projectId: any, milestoneId: any) => {
                this.form.reset();
                this.projectId = projectId;
                this.milestoneId = milestoneId;
                this.lightboxService.open($(this.elementRef.nativeElement));
            },
        );
    }

    ngOnDestroy(): void {
        this.unwatch();
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

        this.rs.issues.bulkCreate(this.projectId, this.milestoneId, this.form.value.bulk).then(
            (result: any) => {
                this.submitting = false;
                const issues = result.data.map((it: any) => this.model.make_model("issues", it));

                this.rootScope.$broadcast("issueform:new:success", issues);
                this.close();
                this.confirm.notify("success");
            },
            () => {
                this.submitting = false;
                this.confirm.notify("error");
            },
        );
    }
}
