import { Component, ElementRef, HostListener, Inject, Input, OnChanges, SimpleChanges } from "@angular/core";
import { AbstractControl, FormControl, Validators } from "@angular/forms";
import { AJS_CONFIRM, AJS_ROOT_SCOPE, AJS_TG_RESOURCES, AJS_TRANSLATE } from "../shared/ajs-tokens";
import { FormErrorMessageService } from "../shared/form-error-message.service";

declare const _: any;

interface ProjectTag {
    name: string;
    color: string | null;
}

interface TagEdition {
    name: FormControl<string | null>;
    color: string | null;
}

/**
 * Angular replacement for the AngularJS `tgProjectTags` directive + `ProjectTagsController`
 * (app/coffee/modules/admin/project-values.coffee) - the admin "Tags" page (create, edit,
 * delete, filter, and merge project tags). The pair was ambient (`$el.controller()` +
 * `ng-controller` on the same element, reading `$scope.projectId` off
 * `ProjectValuesSectionController`) and drove the DOM by toggling `.hidden` classes via
 * jQuery; both become plain component state here. Caller (admin-project-values-tags.jade)
 * switched to `bind-project="project"`.
 *
 * The page header's "New tag" button lives next to `tg-main-title` (still AngularJS), so it
 * stays in the jade template and bumps a counter bound to `@Input() addNewRequests` -
 * every increment opens the "new tag" row, same as the original's `.show-add-new` click
 * handler did through `$el.on("click", ...)` on the shared ancestor section.
 *
 * Checksley validated the tag name field (`data-required` + `data-maxlength="255"`) on
 * both the "new" row and each "edit" row - same two rules here, one `FormControl` per open
 * row. API field errors map back onto those controls by the original field names
 * (`tag` for create, `to_tag` for edit), same as `form.setErrors(response.data)` keyed off
 * the inputs' `name` attributes.
 *
 * The original "add" click was wrapped in `taiga.debounce 2000` (leading-edge, i.e. a
 * double-click guard) - replaced by the `loadingCreate` in-flight guard used everywhere
 * else in this migration. `$model.make_model('tag', ...)`'s `clone()`/`revert()` (used
 * only to remember a tag's original name while editing it) becomes a separate per-row
 * edition state keyed by the original name, so the displayed tag is never mutated until
 * the server confirms.
 */
@Component({
    selector: "tg-project-tags",
    templateUrl: "./project-tags.component.html",
})
export class ProjectTagsComponent implements OnChanges {
    @Input() project: any;
    @Input() addNewRequests: any;

    readonly version = (window as any)._version;
    readonly spinnerSrc = `${this.version}/svg/spinner-circle.svg`;

    loading = true;
    loadingCreate = false;
    loadingEdit = false;
    loadingDelete = false;
    loadingMixing = false;

    projectTagsAll: ProjectTag[] = [];
    projectTags: ProjectTag[] = [];
    tagsFilter = "";

    showNewValue = false;
    newValueColor: string | null = "";
    newValueName = new FormControl("", [Validators.required, Validators.maxLength(255)]);

    editions: { [originalName: string]: TagEdition } = {};

    mixingTags: { toTag: string | null; fromTags: string[] } = { toTag: null, fromTags: [] };

    private loadedProjectId: any;

    constructor(
        private elementRef: ElementRef,
        @Inject(AJS_TG_RESOURCES) private rs: any,
        @Inject(AJS_CONFIRM) private confirm: any,
        @Inject(AJS_TRANSLATE) private translate: any,
        @Inject(AJS_ROOT_SCOPE) private rootScope: any,
        public errors: FormErrorMessageService,
    ) {}

    ngOnChanges(changes: SimpleChanges): void {
        if (this.project?.id && this.project.id !== this.loadedProjectId) {
            this.loadedProjectId = this.project.id;
            this.loadTags();
        }

        if (changes["addNewRequests"] && !changes["addNewRequests"].firstChange && this.addNewRequests) {
            this.openNewValue();
        }
    }

    @HostListener("window:keyup.escape")
    onWindowEscape(): void {
        this.cancelMixingTags();
    }

    // Loading / filtering

    loadTags(): Promise<void> {
        return this.rs.projects.tagsColors(this.project.id).then((tags: any) => {
            this.projectTagsAll = _.map(tags.getAttrs(), (color: string, name: string) => ({ name, color }));
            this.filterAndSortTags();
            this.loading = false;
        });
    }

    filterAndSortTags(): void {
        const sorted = _.sortBy(this.projectTagsAll, (it: ProjectTag) => it.name.toLowerCase());

        this.projectTags = sorted.filter((tag: ProjectTag) => tag.name.indexOf(this.tagsFilter) !== -1);
    }

    onTagsFilterChange(value: string): void {
        this.tagsFilter = value || "";
        this.filterAndSortTags();
    }

    trackByName(index: number, tag: ProjectTag): string {
        return tag.name;
    }

    // New tag

    openNewValue(): void {
        this.showNewValue = true;
        this.focusLater(".new-value input");
    }

    closeNewValue(): void {
        this.showNewValue = false;
        this.newValueColor = "";
        this.newValueName.reset("");
    }

    onNewValueKeyup(event: KeyboardEvent): void {
        if (event.key === "Enter") {
            event.preventDefault();
            this.saveNewValue();
        } else if (event.key === "Escape") {
            this.closeNewValue();
        }
    }

    saveNewValue(): void {
        if (this.loadingCreate) {
            return;
        }

        if (this.newValueName.invalid) {
            this.newValueName.markAsTouched();
            return;
        }

        this.loadingCreate = true;

        this.rs.projects.createTag(this.project.id, this.newValueName.value, this.newValueColor).then(
            () => {
                this.loadTags().then(() => {
                    this.loadingCreate = false;
                    this.rootScope.$broadcast("tags:updated");
                    this.closeNewValue();
                });
            },
            (response: any) => {
                this.loadingCreate = false;
                this.applyServerErrors(response?.data, { tag: this.newValueName });
            },
        );
    }

    // Edit tag

    isEditing(tag: ProjectTag): boolean {
        return !!this.editions[tag.name];
    }

    startEdit(tag: ProjectTag): void {
        this.editions[tag.name] = {
            name: new FormControl(tag.name, [Validators.required, Validators.maxLength(255)]),
            color: tag.color,
        };
        this.focusLater(`.edition[data-tag="${CSS.escape(tag.name)}"] input`, true);
    }

    cancelEdit(tag: ProjectTag): void {
        delete this.editions[tag.name];
    }

    onEditKeyup(event: KeyboardEvent, tag: ProjectTag): void {
        if (event.key === "Enter") {
            event.preventDefault();
            this.saveEdit(tag);
        } else if (event.key === "Escape") {
            this.cancelEdit(tag);
        }
    }

    saveEdit(tag: ProjectTag): void {
        const edition = this.editions[tag.name];

        if (!edition) {
            return;
        }

        if (edition.name.invalid) {
            edition.name.markAsTouched();
            return;
        }

        const fromTag = tag.name;
        const toTag = edition.name.value === fromTag ? null : edition.name.value;

        this.loadingEdit = true;

        this.rs.projects.editTag(this.project.id, fromTag, toTag, edition.color).then(
            () => {
                this.loadTags().then(() => {
                    delete this.editions[fromTag];
                    this.loadingEdit = false;
                    this.rootScope.$broadcast("tags:updated");
                });
            },
            (response: any) => {
                this.loadingEdit = false;
                this.applyServerErrors(response?.data, { to_tag: edition.name });
            },
        );
    }

    // Delete tag

    deleteTag(tag: ProjectTag): void {
        const title = this.translate.instant("ADMIN.COMMON.TITLE_ACTION_DELETE_TAG");

        this.confirm.askOnDelete(title, tag.name).then((response: any) => {
            this.loadingDelete = true;

            this.rs.projects.deleteTag(this.project.id, tag.name).then(
                () => {
                    this.loadingDelete = false;
                    this.loadTags().finally(() => {
                        this.rootScope.$broadcast("tags:updated");
                        response.finish();
                    });
                },
                () => {
                    this.loadingDelete = false;
                    this.confirm.notify("error");
                },
            );
        });
    }

    // Mixing (merge) tags

    startMixingTags(tag: ProjectTag): void {
        this.mixingTags.toTag = tag.name;
    }

    toggleMixingFromTags(tag: ProjectTag): void {
        if (tag.name === this.mixingTags.toTag) {
            return;
        }

        const index = this.mixingTags.fromTags.indexOf(tag.name);

        if (index === -1) {
            this.mixingTags.fromTags.push(tag.name);
        } else {
            this.mixingTags.fromTags.splice(index, 1);
        }
    }

    confirmMixingTags(): void {
        this.loadingMixing = true;

        this.rs.projects
            .mixTags(this.project.id, this.mixingTags.toTag, this.mixingTags.fromTags)
            .then(() => {
                this.cancelMixingTags();
                this.loadTags();
            })
            .finally(() => {
                this.loadingMixing = false;
            });
    }

    cancelMixingTags(): void {
        this.mixingTags = { toTag: null, fromTags: [] };
    }

    mixingClass(tag: ProjectTag): string {
        if (this.mixingTags.toTag !== null) {
            if (tag.name === this.mixingTags.toTag) {
                return "mixing-tags-to";
            } else if (this.mixingTags.fromTags.indexOf(tag.name) !== -1) {
                return "mixing-tags-from";
            }
        }

        return "";
    }

    // Helpers

    private applyServerErrors(data: any, controls: { [field: string]: AbstractControl }): void {
        Object.keys(data || {}).forEach((field) => {
            const control = controls[field];

            if (control) {
                const message = Array.isArray(data[field]) ? data[field][0] : data[field];

                control.setErrors({ server: message });
                control.markAsTouched();
            }
        });

        if (data?._error_message) {
            this.confirm.notify("error", data._error_message);
        }
    }

    private focusLater(selector: string, select = false): void {
        setTimeout(() => {
            const input = (this.elementRef.nativeElement as HTMLElement).querySelector(selector) as HTMLInputElement | null;

            if (input) {
                input.focus();

                if (select) {
                    input.select();
                }
            }
        });
    }
}
