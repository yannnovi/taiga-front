import { Component, ElementRef, Inject, Input, OnDestroy } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { pikadayValidator } from "../shared/checksley-validators";
import {
    AJS_CONFIRM,
    AJS_DATE_PICKER_CONFIG_SERVICE,
    AJS_LIGHTBOX_SERVICE,
    AJS_PROJECT_SERVICE,
    AJS_REPO,
    AJS_ROOT_SCOPE,
    AJS_TRANSLATE,
} from "../shared/ajs-tokens";
import { FormErrorMessageService } from "../shared/form-error-message.service";

declare const $: any;
declare const _: any;
declare const moment: any;
declare const Pikaday: any;

/**
 * Angular replacement for the AngularJS `tgLbCreateEditSprint` directive
 * (app/coffee/modules/backlog/lightboxes.coffee), downgraded in place under the same name.
 * Placed statically inside `BacklogController`'s own template (`backlog.jade`), same as the
 * original (no isolate scope) - opens on the `sprintform:create`/`sprintform:edit`
 * broadcasts, same event names, same payloads.
 *
 * `@Input() sprints` (`bind-sprints="sprints"`) is the one real read from the ambient scope
 * this directive used (`$scope.sprints`, for `getLastSprint()`'s new-sprint date defaults) -
 * everything else the original also read/wrote on that shared scope
 * (`$scope.sprints = _.map(...)`, `$scope.sprintsCounter +=/-= 1`) is dropped here, not
 * ported: `BacklogController` already listens to the same
 * `sprintform:create/edit/remove:success` broadcasts this component (still) emits, and
 * fully reloads (`loadSprints()`/`loadProjectStats()`) right after - the directive's
 * in-place scope mutation was already redundant with that reload in the original too.
 *
 * The two date fields are driven by Pikaday directly (`tgDateSelector` in the original -
 * an ambient, non-isolate-scope directive with no Angular-bindable surface, so it's
 * rewritten natively here rather than wrapped, same precedent as the backlog
 * points/status/edit popovers). `pikadayValidator` (`checksley-validators.ts`) validates
 * the resulting text value the same way checksley's own `pikaday` type did.
 */
@Component({
    selector: "tg-lb-create-edit-sprint",
    templateUrl: "./lightbox-create-edit-sprint.component.html",
})
export class LightboxCreateEditSprintComponent implements OnDestroy {
    @Input() sprints: any[] = [];

    form: FormGroup;

    createSprint = true;
    open = false;
    hasErrors = false;
    canDelete = false;
    lastSprintName: string | null = null;

    submitting = false;

    private currentSprint: any;
    private projectId: any;
    private ussToAdd: any;
    private startPicker: any;
    private finishPicker: any;
    private unwatchCreate: () => void;
    private unwatchEdit: () => void;

    constructor(
        private elementRef: ElementRef,
        @Inject(AJS_LIGHTBOX_SERVICE) private lightboxService: any,
        @Inject(AJS_REPO) private repo: any,
        @Inject(AJS_CONFIRM) private confirm: any,
        @Inject(AJS_ROOT_SCOPE) private rootScope: any,
        @Inject(AJS_TRANSLATE) private translate: any,
        @Inject(AJS_PROJECT_SERVICE) private projectService: any,
        @Inject(AJS_DATE_PICKER_CONFIG_SERVICE) private datePickerConfigService: any,
        public errors: FormErrorMessageService,
    ) {
        this.form = this.buildForm();

        this.unwatchCreate = this.rootScope.$on(
            "sprintform:create",
            (event: any, projectId: any, uss: any) => {
                this.openCreate(projectId, uss);
            },
        );

        this.unwatchEdit = this.rootScope.$on("sprintform:edit", (event: any, sprint: any) => {
            this.openEdit(sprint);
        });
    }

    ngOnDestroy(): void {
        this.unwatchCreate();
        this.unwatchEdit();
        this.destroyPickers();
    }

    close(): void {
        this.lightboxService.close($(this.elementRef.nativeElement));
        this.open = false;
    }

    submit(): void {
        if (this.submitting || this.form.invalid) {
            this.hasErrors = true;
            this.form.markAllAsTouched();
            return;
        }

        this.hasErrors = false;
        this.submitting = true;

        const prettyDate = this.translate.instant("COMMON.PICKERDATE.FORMAT");
        const estimatedStart = moment(this.form.value.estimated_start, prettyDate).format("YYYY-MM-DD");
        const estimatedFinish = moment(this.form.value.estimated_finish, prettyDate).format("YYYY-MM-DD");

        let promise;
        let event: string;

        if (this.createSprint) {
            const newSprint = {
                project: this.projectId,
                name: this.form.value.name,
                slug: null,
                estimated_start: estimatedStart,
                estimated_finish: estimatedFinish,
            };

            promise = this.repo.create("milestones", newSprint);
            event = "sprintform:create:success";
        } else {
            const newSprint = this.currentSprint.realClone();

            newSprint.name = this.form.value.name;
            newSprint.estimated_start = estimatedStart;
            newSprint.estimated_finish = estimatedFinish;

            promise = this.repo.save(newSprint);
            event = "sprintform:edit:success";
        }

        promise.then(
            (data: any) => {
                this.submitting = false;

                if (event === "sprintform:create:success" && this.ussToAdd) {
                    this.rootScope.$broadcast(event, data, this.ussToAdd);
                } else {
                    this.rootScope.$broadcast(event, data);
                }

                this.close();
            },
            (data: any) => {
                this.submitting = false;

                Object.keys(data || {}).forEach((field) => {
                    const control = this.form.get(field);

                    if (control) {
                        const message = Array.isArray(data[field]) ? data[field][0] : data[field];

                        control.setErrors({ server: message });
                        control.markAsTouched();
                    }
                });

                if (data._error_message) {
                    this.confirm.notify("light-error", data._error_message);
                } else if (data.__all__) {
                    this.confirm.notify("light-error", data.__all__[0]);
                }
            },
        );
    }

    remove(): void {
        const title = this.translate.instant("LIGHTBOX.DELETE_SPRINT.TITLE");
        const message = this.currentSprint.name;

        this.confirm.askOnDelete(title, message).then((askResponse: any) => {
            this.repo.remove(this.currentSprint).then(
                () => {
                    askResponse.finish();
                    this.close();
                    this.rootScope.$broadcast("sprintform:remove:success", this.currentSprint);
                },
                () => {
                    askResponse.finish(false);
                    this.confirm.notify("error");
                },
            );
        });
    }

    private buildForm(): FormGroup {
        const prettyDate = this.translate.instant("COMMON.PICKERDATE.FORMAT");

        return new FormGroup({
            name: new FormControl("", [Validators.required, Validators.maxLength(500)]),
            estimated_start: new FormControl("", [Validators.required, pikadayValidator(prettyDate)]),
            estimated_finish: new FormControl("", [Validators.required, pikadayValidator(prettyDate)]),
        });
    }

    private openCreate(projectId: any, uss: any): void {
        this.createSprint = true;
        this.canDelete = false;
        this.ussToAdd = uss;
        this.projectId = projectId;
        this.hasErrors = false;
        this.form = this.buildForm();

        const prettyDate = this.translate.instant("COMMON.PICKERDATE.FORMAT");
        const lastSprint = this.getLastSprint();

        const estimatedStart = lastSprint ? moment(lastSprint.estimated_finish) : moment();
        const estimatedFinish = lastSprint
            ? moment(lastSprint.estimated_finish).add(2, "weeks")
            : moment().add(2, "weeks");

        this.form.patchValue({
            estimated_start: estimatedStart.format(prettyDate),
            estimated_finish: estimatedFinish.format(prettyDate),
        });

        this.lastSprintName = lastSprint?.name || null;
        this.open = true;
        this.lightboxService.open($(this.elementRef.nativeElement));

        setTimeout(() => {
            this.initPickers();

            const nameInput = this.elementRef.nativeElement.querySelector(".sprint-name");

            nameInput?.focus();
        }, 0);
    }

    private openEdit(sprint: any): void {
        this.createSprint = false;
        this.canDelete = this.projectService.canEdit("delete_milestone");
        this.currentSprint = sprint;
        this.hasErrors = false;
        this.form = this.buildForm();

        const prettyDate = this.translate.instant("COMMON.PICKERDATE.FORMAT");

        this.form.patchValue({
            name: sprint.name,
            estimated_start: moment(sprint.estimated_start).format(prettyDate),
            estimated_finish: moment(sprint.estimated_finish).format(prettyDate),
        });

        this.lastSprintName = null;
        this.open = true;
        this.lightboxService.open($(this.elementRef.nativeElement));

        setTimeout(() => {
            this.initPickers();

            const nameInput = this.elementRef.nativeElement.querySelector(".sprint-name");

            nameInput?.focus();
            nameInput?.select();
        }, 0);
    }

    private getLastSprint(): any {
        const openSprints = _.filter(this.sprints, (sprint: any) => !sprint.closed);
        const sortedSprints = _.sortBy(openSprints, (sprint: any) =>
            moment(sprint.estimated_finish, "YYYY-MM-DD").format("X"),
        );

        return sortedSprints[sortedSprints.length - 1];
    }

    private initPickers(): void {
        this.destroyPickers();

        this.startPicker = this.initPicker(".date-start", "estimated_start");
        this.finishPicker = this.initPicker(".date-end", "estimated_finish");
    }

    private initPicker(selector: string, controlName: string): any {
        const input = this.elementRef.nativeElement.querySelector(selector);

        if (!input) {
            return null;
        }

        const config = this.datePickerConfigService.get();
        const control = this.form.get(controlName);

        const picker = new Pikaday({
            ...config,
            field: input,
            onSelect: () => {
                control?.setValue(input.value);
                control?.markAsTouched();
            },
        });

        picker.setDate(control?.value, true);
        input.value = control?.value || "";

        return picker;
    }

    private destroyPickers(): void {
        this.startPicker?.destroy();
        this.finishPicker?.destroy();
        this.startPicker = null;
        this.finishPicker = null;
    }
}
