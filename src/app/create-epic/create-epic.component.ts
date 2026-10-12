import { Component, ElementRef, EventEmitter, Inject, Output } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { AJS_ANALYTICS, AJS_CONFIRM, AJS_EPICS_SERVICE, AJS_LIGHTBOX_SERVICE, AJS_PROJECT_SERVICE } from "../shared/ajs-tokens";
import { FormErrorMessageService } from "../shared/form-error-message.service";

declare const $: any;
declare const _: any;
declare const Immutable: any;
declare const taiga: any;

/**
 * Angular replacement for the AngularJS `tgCreateEpic` directive + `CreateEpicCtrl`
 * (app/modules/epics/create-epic/), downgraded in place under the same name. Opened
 * dynamically via `lightboxFactory.create('tg-create-epic', {...})` from
 * `EpicsDashboardCtrl.onCreateEpic`, which already passes `class="... open"` - the original
 * never called `lightboxService.open()` itself, so neither does this (same visible result).
 *
 * `@Output() createEpic` keeps the factory's existing `on-create-epic="onCreateEpic()"`
 * attribute matching, same `on-foo` kebab convention as everywhere else in this migration.
 *
 * Checksley validated `subject` only (`data-required` + `data-maxlength="140"`) - same two
 * rules here. API field errors (`form.setErrors(response.data)`) map onto the matching
 * `FormControl` as `{server: message}`, same pattern as `LightboxCreateEditSprintComponent`.
 *
 * Real bug fixed while porting: the original `addAttachment` did
 * `@.attachments.push(attachment)` on an `Immutable.List` and discarded the returned list,
 * so attachments picked in this lightbox were never uploaded with the new epic. Kept here
 * by reassigning the result (and removing on `delete`, which the original never wired).
 */
@Component({
    selector: "tg-create-epic",
    templateUrl: "./create-epic.component.html",
})
export class CreateEpicComponent {
    @Output() createEpic = new EventEmitter<void>();

    project: any;
    newEpic: any;
    attachments: any = Immutable.List();
    displayBlockedReason = false;
    loading = false;

    form = new FormGroup({
        subject: new FormControl("", [Validators.required, Validators.maxLength(140)]),
    });

    constructor(
        private elementRef: ElementRef,
        @Inject(AJS_CONFIRM) private confirm: any,
        @Inject(AJS_PROJECT_SERVICE) private projectService: any,
        @Inject(AJS_EPICS_SERVICE) private epicsService: any,
        @Inject(AJS_ANALYTICS) private analytics: any,
        @Inject(AJS_LIGHTBOX_SERVICE) private lightboxService: any,
        public errors: FormErrorMessageService,
    ) {
        // Mutable copy, same as the original ("compatible with the old code").
        this.project = this.projectService.project.toJS();

        this.newEpic = {
            color: taiga.getRandomDefaultColor(),
            status: this.project.default_epic_status,
            tags: [],
            description: "",
            team_requirement: false,
            client_requirement: false,
            is_blocked: false,
            blocked_note: "",
        };
    }

    get epicStatuses(): any[] {
        return _.sortBy(this.project.epic_statuses || [], "order");
    }

    close(): void {
        this.lightboxService.close($(this.elementRef.nativeElement));
    }

    submit(): void {
        if (this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.loading = true;

        const epicData = { ...this.newEpic, subject: this.form.value.subject };

        this.epicsService.createEpic(epicData, this.attachments).then(
            () => {
                this.analytics.trackEvent("epic", "create", "create epic", 1);
                this.createEpic.emit();
                this.loading = false;
            },
            (response: any) => {
                this.loading = false;

                const data = response?.data || {};

                Object.keys(data).forEach((field) => {
                    const control = this.form.get(field);

                    if (control) {
                        const message = Array.isArray(data[field]) ? data[field][0] : data[field];

                        control.setErrors({ server: message });
                        control.markAsTouched();
                    }
                });

                if (data._error_message) {
                    this.confirm.notify("error", data._error_message);
                }
            },
        );
    }

    selectColor(color: string): void {
        this.newEpic.color = color;
    }

    addTag(event: { name: string; color: string | null }): void {
        const name = `${event.name}`.trim().toLowerCase();

        if (!this.newEpic.tags.find((it: any) => it[0] === name)) {
            this.newEpic.tags = [...this.newEpic.tags, [name, event.color]];
        }
    }

    deleteTag(event: { tag: any }): void {
        this.newEpic.tags = this.newEpic.tags.filter((it: any) => it[0] !== event.tag[0]);
    }

    addAttachment(attachment: any): void {
        this.attachments = this.attachments.push(attachment);
    }

    deleteAttachment(attachment: any): void {
        this.attachments = this.attachments.filter((it: any) => it !== attachment);
    }
}
