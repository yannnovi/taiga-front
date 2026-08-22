import { Component, ElementRef, HostListener, Inject, Input, OnDestroy } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { linewidthValidator } from "../shared/checksley-validators";
import {
    AJS_CONFIRM,
    AJS_LIGHTBOX_SERVICE,
    AJS_MODEL,
    AJS_ROOT_SCOPE,
    AJS_TG_RESOURCES,
    AJS_TRANSLATE,
} from "../shared/ajs-tokens";
import { FormErrorMessageService } from "../shared/form-error-message.service";

declare const $: any;

/**
 * Angular replacement for the AngularJS `tgLbCreateBulkUserstories` directive
 * (app/coffee/modules/common/lightboxes.coffee), downgraded in place under the same name.
 * Placed statically in both `backlog.jade` and `kanban.jade` (ambient, no isolate scope in
 * the original) - opens on the `usform:bulk` broadcast, same as before.
 *
 * `@Input() project`/`swimlanes`/`noSwimlaneUserStories` are the ambient reads the original
 * made directly on its host scope (`$scope.project`/`swimlanesList`/`noSwimlaneUserStories`,
 * both `BacklogController` and `KanbanController` already expose these under the same
 * names) - bridged via `bind-x` from both callers. `tg-swimlane-selector` is already a
 * downgraded Angular component (`SwimlaneSelectorComponent`), so it's used directly here
 * with native Angular two-way syntax (`[(value)]`), no `bind-x`/`bindon-x` bridge needed
 * for an Angular-to-Angular call.
 *
 * The status dropdown and position radios aren't checksley-validated fields in the
 * original (no `data-*` validation attributes on them) - only the bulk textarea is, so
 * `form` only tracks `bulk`/`us_position`; status/swimlane stay as plain component state,
 * same division of responsibility as the original.
 */
@Component({
    selector: "tg-lb-create-bulk-userstories",
    templateUrl: "./lightbox-create-bulk-userstories.component.html",
})
export class LightboxCreateBulkUserstoriesComponent implements OnDestroy {
    @Input() project: any;
    @Input() swimlanes: any;
    @Input() noSwimlaneUserStories = false;

    form = new FormGroup({
        bulk: new FormControl("", [Validators.required, linewidthValidator(200)]),
        us_position: new FormControl("bottom"),
    });

    displayStatusSelector = false;
    currentStatus: any = null;
    swimlaneValue: any;
    submitting = false;

    /** Stable object identity for `tg-swimlane-selector`'s `[userStory]` input - a fresh
     *  object literal in the template would re-trigger its `ngOnChanges` every change
     *  detection cycle for no reason. */
    readonly draftUserStory = { id: null };

    private projectId: any;
    private statusId: any;
    private unwatch: () => void;

    constructor(
        private elementRef: ElementRef,
        @Inject(AJS_LIGHTBOX_SERVICE) private lightboxService: any,
        @Inject(AJS_TG_RESOURCES) private rs: any,
        @Inject(AJS_ROOT_SCOPE) private rootScope: any,
        @Inject(AJS_MODEL) private model: any,
        @Inject(AJS_CONFIRM) private confirm: any,
        @Inject(AJS_TRANSLATE) private translate: any,
        public errors: FormErrorMessageService,
    ) {
        this.unwatch = this.rootScope.$on(
            "usform:bulk",
            (event: any, projectId: any, status: any, swimlaneId: any) => {
                this.form.reset({ bulk: "", us_position: "bottom" });
                this.projectId = projectId;
                this.statusId = status;
                this.swimlaneValue = swimlaneId;
                this.updateCurrentStatus();
                this.lightboxService.open($(this.elementRef.nativeElement));
            },
        );
    }

    ngOnDestroy(): void {
        this.unwatch();
    }

    @HostListener("document:click", ["$event"])
    onDocumentClick(event: MouseEvent): void {
        const target = event.target as HTMLElement;

        if (!target.closest(".bulk-status-selector-wrapper")) {
            this.displayStatusSelector = false;
        }
    }

    toggleStatus(): void {
        this.displayStatusSelector = !this.displayStatusSelector;
    }

    setStatus(status: any): void {
        this.statusId = status.id;
        this.currentStatus = status;
        this.displayStatusSelector = false;
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

        let swimlaneId = null;

        if (this.project.is_kanban_activated) {
            swimlaneId = this.swimlaneValue !== undefined ? this.swimlaneValue : this.project.default_swimlane;
        }

        this.rs.userstories.bulkCreate(this.projectId, this.statusId, this.form.value.bulk, swimlaneId).then(
            (result: any) => {
                this.submitting = false;

                const userstories = result.data.map((it: any) => this.model.make_model("userstories", it));

                this.rootScope.$broadcast("usform:bulk:success", userstories, this.form.value.us_position);
                this.close();
            },
            (response: any) => {
                this.submitting = false;

                if (response?.bulk) {
                    this.form.get("bulk")?.setErrors({ server: response.bulk[0] });
                    this.form.get("bulk")?.markAsTouched();
                }

                if (response.data?.status) {
                    this.confirm.notify("error", this.translate.instant("LIGHTBOX.CREATE_EDIT.ERROR_STATUS"));
                }

                if (response.data?.swimlane_id) {
                    this.confirm.notify("error", this.translate.instant("LIGHTBOX.CREATE_EDIT.ERROR_SWIMLANE"));
                }

                if (response._error_message) {
                    this.confirm.notify("error", response._error_message);
                }
            },
        );
    }

    private updateCurrentStatus(): void {
        this.currentStatus = (this.project?.us_statuses || []).find((status: any) => status.id === this.statusId);
    }
}
