import { Component, ElementRef, Inject, Input, OnDestroy } from "@angular/core";
import { FormControl, FormGroup } from "@angular/forms";
import { linewidthValidator } from "../shared/checksley-validators";
import { AJS_LIGHTBOX_SERVICE, AJS_MODEL, AJS_ROOT_SCOPE, AJS_TG_RESOURCES } from "../shared/ajs-tokens";
import { FormErrorMessageService } from "../shared/form-error-message.service";

declare const $: any;

/**
 * Angular replacement for the AngularJS `tgLbCreateBulkTasks` directive
 * (app/coffee/modules/taskboard/lightboxes.coffee), downgraded in place under the same
 * name - same shape as `LightboxCreateBulkIssuesComponent`, opened via a `taskform:bulk`
 * broadcast rather than `lightboxFactory.create`.
 *
 * Unlike the issues one, the original *did* read one real ambient value beyond the
 * broadcast payload - `$scope.projectId` (set by `TaskboardController`, the route
 * controller sharing that scope) - so this needs an actual `@Input() projectId`, bound
 * from `taskboard.jade` (`bind-project-id="projectId"`, the same bare scope value the
 * original read implicitly).
 *
 * The original had no error handling at all on a failed bulk-create (`# TODO: error
 * handling`, an empty `.then(null, -> currentLoading.finish())`) - kept as a silent no-op
 * on failure, not "fixed" with a new `$confirm.notify("error")` the original never had.
 */
@Component({
    selector: "tg-lb-create-bulk-tasks",
    templateUrl: "./lightbox-create-bulk-tasks.component.html",
})
export class LightboxCreateBulkTasksComponent implements OnDestroy {
    @Input() projectId: any;

    form = new FormGroup({
        data: new FormControl("", linewidthValidator(200)),
    });

    submitting = false;

    private sprintId: any;
    private usId: any;
    private unwatch: () => void;

    constructor(
        private elementRef: ElementRef,
        @Inject(AJS_LIGHTBOX_SERVICE) private lightboxService: any,
        @Inject(AJS_TG_RESOURCES) private rs: any,
        @Inject(AJS_ROOT_SCOPE) private rootScope: any,
        @Inject(AJS_MODEL) private model: any,
        public errors: FormErrorMessageService,
    ) {
        this.unwatch = this.rootScope.$on(
            "taskform:bulk",
            (event: any, sprintId: any, usId: any) => {
                this.form.reset();
                this.sprintId = sprintId;
                this.usId = usId;
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

        this.rs.tasks.bulkCreate(this.projectId, this.sprintId, this.usId, this.form.value.data).then(
            (result: any) => {
                this.submitting = false;
                const tasks = result.map((it: any) => this.model.make_model("tasks", it));

                this.rootScope.$broadcast("taskform:bulk:success", tasks);
                this.close();
            },
            () => {
                this.submitting = false;
            },
        );
    }
}
