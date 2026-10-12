import { Component, ElementRef, EventEmitter, Inject, Input, OnChanges, OnDestroy, Output, SimpleChanges } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import {
    AJS_ANALYTICS,
    AJS_CONFIRM,
    AJS_CURRENT_USER_SERVICE,
    AJS_LIGHTBOX_SERVICE,
    AJS_PROJECT_SERVICE,
    AJS_RESOURCES,
} from "../shared/ajs-tokens";
import { FormErrorMessageService } from "../shared/form-error-message.service";

declare const $: any;
declare const Immutable: any;

/**
 * Angular replacement for the AngularJS `tgRelatedUserstoriesCreate` directive +
 * `RelatedUserstoriesCreateCtrl` (app/modules/epics/related-userstories/
 * related-userstories-create/), downgraded in place under the same name. Twin of
 * `LightboxRelateToEpicComponent` (same two-mode lightbox, seen from the epic's side).
 *
 * Bindings: `project`/`epic`/`epicUserstories` (Immutable, as before) become `@Input()`s and
 * `loadRelatedUserstories` (`&`) becomes `@Output() loadRelatedUserstories` - caller
 * (related-userstories.jade) switched to `bind-x`/`on-x`. The original's
 * `showCreateRelatedUserstoriesLightbox` binding was declared but never read - dropped.
 * The host's own `tg-check-permission="modify_epic"` stays on the caller's element (an
 * AngularJS attribute directive still compiled on the downgraded host); the inner button's
 * `tg-check-permission="add_us"` is replicated via `tgProjectService.canEdit`, same as
 * `PromoteToUsButtonComponent`.
 *
 * Two independent checksley forms (`.new-user-story-form`/`.existing-user-story-form`)
 * become two `FormGroup`s with the same `required` rules. Same two dead bits as in
 * `LightboxRelateToEpicComponent`, preserved as observed rather than "fixed": the project
 * `<select>`'s `data-required` sat outside both `<form>`s (never validated), and
 * `form.setErrors(data)` on API failure had no `name`d field to land on (the failure is
 * still surfaced by `confirm.notify("error")`, as before).
 *
 * The search box's `debounceLeading 300` becomes a plain trailing 300ms debounce, same as
 * the sibling component.
 */
@Component({
    selector: "tg-related-userstories-create",
    templateUrl: "./related-userstories-create.component.html",
})
export class RelatedUserstoriesCreateComponent implements OnChanges, OnDestroy {
    @Input() project: any;
    @Input() epic: any;
    @Input() epicUserstories: any;
    @Output() loadRelatedUserstories = new EventEmitter<void>();

    relatedWithSelector: "new-user-story" | "existing-user-story" = "new-user-story";
    creationMode: "single-new-user-story" | "bulk-new-user-stories" = "single-new-user-story";

    projects: any = null;
    projectUserstories: any = Immutable.List();
    selectedProject: any;
    searchUserstory = "";
    loading = false;

    newUserstoryForm = new FormGroup({
        relatedUserstoriesText: new FormControl("", Validators.required),
    });

    existingUserstoryForm = new FormGroup({
        selectedUserstory: new FormControl("", Validators.required),
    });

    private searchDebounce: any;

    constructor(
        private elementRef: ElementRef,
        @Inject(AJS_LIGHTBOX_SERVICE) private lightboxService: any,
        @Inject(AJS_CURRENT_USER_SERVICE) private currentUserService: any,
        @Inject(AJS_RESOURCES) private rs: any,
        @Inject(AJS_CONFIRM) private confirm: any,
        @Inject(AJS_ANALYTICS) private analytics: any,
        @Inject(AJS_PROJECT_SERVICE) private projectService: any,
        public errors: FormErrorMessageService,
    ) {}

    ngOnChanges(changes: SimpleChanges): void {
        if (changes["project"] && this.project) {
            this.selectedProject = this.project.get("id");
        }
    }

    ngOnDestroy(): void {
        clearTimeout(this.searchDebounce);
    }

    canAddUs(): boolean {
        return !!(this.projectService.project && this.projectService.canEdit("add_us"));
    }

    showLightbox(): void {
        this.loadProjects();
        this.selectProject(this.selectedProject).then(() => {
            this.lightboxService.open(this.lightboxEl());
        });
    }

    closeLightbox(): void {
        this.searchUserstory = "";
        this.newUserstoryForm.reset({ relatedUserstoriesText: "" });
        this.existingUserstoryForm.reset({ selectedUserstory: "" });
        this.lightboxService.close(this.lightboxEl());
    }

    selectProject(projectId: any): Promise<void> {
        this.selectedProject = projectId;
        this.existingUserstoryForm.reset({ selectedUserstory: "" });
        this.searchUserstory = "";
        return this.filterUss();
    }

    onSearchUserstoryChange(): void {
        clearTimeout(this.searchDebounce);
        this.searchDebounce = setTimeout(() => {
            this.existingUserstoryForm.reset({ selectedUserstory: "" });
            this.filterUss();
        }, 300);
    }

    saveRelatedUserStory(): void {
        if (this.existingUserstoryForm.invalid) {
            this.existingUserstoryForm.markAllAsTouched();
            return;
        }

        this.loading = true;

        this.rs.epics.addRelatedUserstory(this.epic.get("id"), this.existingUserstoryForm.value.selectedUserstory).then(
            () => this.onSaved(),
            () => this.onError(),
        );
    }

    bulkCreateRelatedUserStories(): void {
        if (this.newUserstoryForm.invalid) {
            this.newUserstoryForm.markAllAsTouched();
            return;
        }

        this.loading = true;

        this.rs.epics
            .bulkCreateRelatedUserStories(
                this.epic.get("id"),
                this.selectedProject,
                this.newUserstoryForm.value.relatedUserstoriesText,
            )
            .then(
                () => this.onSaved(),
                () => this.onError(),
            );
    }

    private onSaved(): void {
        this.analytics.trackEvent("epic related user story", "create", "create related user story on epic", 1);
        this.loading = false;
        this.closeLightbox();
        this.loadRelatedUserstories.emit();
    }

    private onError(): void {
        this.loading = false;
        this.confirm.notify("error");
    }

    private loadProjects(): void {
        if (this.projects === null) {
            this.projects = this.currentUserService.projects.get("unblocked");
        }
    }

    private filterUss(): Promise<void> {
        return this.rs.userstories
            .listInAllProjects({ project: this.selectedProject, q: this.searchUserstory }, true)
            .then((data: any) => {
                const excludeIds = this.epicUserstories ? this.epicUserstories.map((us: any) => us.get("id")) : Immutable.List();

                this.projectUserstories = data.filter((us: any) => excludeIds.indexOf(us.get("id")) === -1);
            });
    }

    private lightboxEl(): any {
        return $(this.elementRef.nativeElement).find(".lightbox-create-related-user-stories");
    }
}
