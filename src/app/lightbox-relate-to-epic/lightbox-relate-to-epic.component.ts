import { Component, ElementRef, Inject, Input, OnDestroy } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import {
    AJS_ANALYTICS,
    AJS_CONFIRM,
    AJS_CURRENT_USER_SERVICE,
    AJS_EPICS_SERVICE,
    AJS_LIGHTBOX_SERVICE,
    AJS_RESOURCES,
    AJS_ROOT_SCOPE,
} from "../shared/ajs-tokens";
import { FormErrorMessageService } from "../shared/form-error-message.service";

declare const $: any;
declare const Immutable: any;

/**
 * Angular replacement for the AngularJS `tgLbRelatetoepic` directive
 * (app/coffee/modules/common/lightboxes.coffee), downgraded in place under the same name.
 * Placed statically in `us-detail.jade` (ambient, no isolate scope in the original) - opens
 * on the `relate-to-epic:add` broadcast, same as before. `$tgResources` was injected by the
 * original but never actually called anywhere in its body (only the no-`$` `tgResources`,
 * `AJS_RESOURCES`, was) - dropped here, not ported, same as other dead injections found
 * elsewhere in this migration.
 *
 * Two independent checksley forms in the original (`.new-epic-form`/`.existing-epic-form`)
 * become two independent `FormGroup`s here. The project `<select>` sits *outside* both
 * `<form>` elements in the original template, so despite its `data-required="true"`
 * attribute, checksley (scoped to `$el.find(".new-epic-form"/".existing-epic-form")`) never
 * actually validated it - that attribute was dead. Preserved as observed (no validation on
 * the project selector here either), not "fixed".
 *
 * The original's `form.setErrors(data)` calls on API failure are dropped (not ported): for
 * `saveRelatedEpic` the target `<select>` had no `name` attribute for checksley to key off
 * of, and `createEpic`'s equivalent line referenced an undefined `errors` variable instead
 * of its own `data` callback parameter (a real bug in the original, not a deliberate
 * quirk - a `ReferenceError` on every failed create, silently swallowed since it's a
 * promise rejection handler). Both paths still surface the failure via
 * `confirm.notify("error")`, same as the original.
 */
@Component({
    selector: "tg-lb-relatetoepic",
    templateUrl: "./lightbox-relate-to-epic.component.html",
})
export class LightboxRelateToEpicComponent implements OnDestroy {
    @Input() project: any;

    relatedWithSelector: "existing-epic" | "new-epic" = "existing-epic";

    projects: any = null;
    projectEpics: any = Immutable.List();
    selectedProject: any;
    selectedEpic: any = "";
    searchEpic = "";
    loading = false;

    newEpicForm = new FormGroup({
        epicSubject: new FormControl("", Validators.required),
    });

    existingEpicForm = new FormGroup({
        selectedEpic: new FormControl("", Validators.required),
    });

    private us: any;
    private searchDebounce: any;
    private unwatch: () => void;

    constructor(
        private elementRef: ElementRef,
        @Inject(AJS_LIGHTBOX_SERVICE) private lightboxService: any,
        @Inject(AJS_CONFIRM) private confirm: any,
        @Inject(AJS_ROOT_SCOPE) private rootScope: any,
        @Inject(AJS_CURRENT_USER_SERVICE) private currentUserService: any,
        @Inject(AJS_RESOURCES) private resources: any,
        @Inject(AJS_EPICS_SERVICE) private epicsService: any,
        @Inject(AJS_ANALYTICS) private analytics: any,
        public errors: FormErrorMessageService,
    ) {
        this.unwatch = this.rootScope.$on("relate-to-epic:add", (event: any, item: any) => {
            this.us = item;
            this.relatedWithSelector = "existing-epic";
            this.selectedEpic = "";
            this.searchEpic = "";
            this.newEpicForm.reset({ epicSubject: "" });
            this.existingEpicForm.reset({ selectedEpic: "" });
            this.loadProjects();
            this.selectedProject = this.project.id;

            this.filterEpics().then(() => {
                this.lightboxService.open($(this.elementRef.nativeElement)).then(() => {
                    $(this.elementRef.nativeElement).find("input").first().focus();
                });
            });
        });
    }

    ngOnDestroy(): void {
        this.unwatch();
        clearTimeout(this.searchDebounce);
    }

    close(): void {
        this.lightboxService.close($(this.elementRef.nativeElement));
    }

    selectProject(projectId: any): void {
        this.selectedProject = projectId;
        this.selectedEpic = "";
        this.searchEpic = "";
        this.filterEpics();
    }

    onSearchEpicChange(): void {
        clearTimeout(this.searchDebounce);
        this.searchDebounce = setTimeout(() => {
            this.selectedEpic = "";
            this.filterEpics();
        }, 300);
    }

    saveRelatedEpic(): void {
        if (this.existingEpicForm.invalid) {
            this.existingEpicForm.markAllAsTouched();
            return;
        }

        this.loading = true;

        const usId = this.us.id;

        this.resources.epics.addRelatedUserstory(this.existingEpicForm.value.selectedEpic, usId).then(
            () => {
                this.analytics.trackEvent(
                    "user story related epic",
                    "create",
                    "create related epic on user story",
                    1,
                );
                this.loading = false;
                this.rootScope.$broadcast("related-epics:changed", this.us);
                this.close();
            },
            () => {
                this.loading = false;
                this.confirm.notify("error");
            },
        );
    }

    createEpic(): void {
        if (this.newEpicForm.invalid) {
            this.newEpicForm.markAllAsTouched();
            return;
        }

        this.loading = true;

        const onError = () => {
            this.loading = false;
            this.confirm.notify("error");
        };

        const onSuccess = () => {
            this.analytics.trackEvent("user story related epic", "create", "create related epic on user story", 1);
            this.loading = false;
            this.rootScope.$broadcast("related-epics:changed", this.us);
            this.close();
        };

        this.epicsService
            .createEpic({ subject: this.newEpicForm.value.epicSubject }, null, this.selectedProject)
            .then((epic: any) => {
                const usId = this.us.id;

                this.resources.epics.addRelatedUserstory(epic.get("id"), usId).then(onSuccess, onError);
            }, onError);
    }

    private loadProjects(): void {
        if (this.projects === null) {
            this.projects = this.currentUserService.projects.get("unblocked");
        }
    }

    private filterEpics(): Promise<void> {
        return this.resources.epics
            .listInAllProjects(
                {
                    is_epics_activated: true,
                    project__blocked_code: "null",
                    project: this.selectedProject,
                    q: this.searchEpic,
                },
                true,
            )
            .then((data: any) => {
                const excludeIds = this.us?.epics ? this.us.epics.map((epic: any) => epic.id) : [];

                this.projectEpics = data.filter((epic: any) => excludeIds.indexOf(epic.get("id")) === -1);
            });
    }
}
