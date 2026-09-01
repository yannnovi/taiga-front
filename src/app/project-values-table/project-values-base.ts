import { Directive, Inject, Input, OnChanges, OnInit } from "@angular/core";
import { CdkDragDrop, moveItemInArray } from "@angular/cdk/drag-drop";
import { FormArray, FormControl, FormGroup, Validators } from "@angular/forms";
import { AJS_CONFIRM, AJS_PROJECT_SERVICE, AJS_REPO, AJS_ROOT_SCOPE, AJS_TG_RESOURCES, AJS_TRANSLATE } from "../shared/ajs-tokens";
import { FormErrorMessageService } from "../shared/form-error-message.service";

declare const _: any;

const DEFAULT_COLOR = "#A9AABC";

/**
 * Shared behaviour for the AngularJS `tgProjectValues` directive's 4 template variants
 * (app/coffee/modules/admin/project-profile.coffee's `ProjectValuesDirective`/
 * `ProjectValuesController`) - a generic add/edit/delete/reorder table for a project's
 * named "values" (epic/US/task/issue statuses, points, priorities, severities, issue
 * types). One subclass per original jade template (`project-types.jade`,
 * `project-status.jade`, `project-us-status.jade`, `project-points.jade`), sharing this
 * base's `FormArray`-per-row logic, since the original was likewise one generic directive
 * with 4 different `include`d templates rather than 4 separate directives.
 *
 * `objName` (used to build the "types" variant's dynamic translation key,
 * `ADMIN.PROJECT_VALUES_<OBJNAME>.ACTION_ADD`) and `type`/`resource` (the API resource/type
 * pair, e.g. `resource="issues"`, `type="severities"`) are kept as two separate inputs,
 * matching the original's own two separate jade attributes - the "issue types" section
 * passes `objName="types"` but `type="issue-types"`, so they aren't interchangeable.
 *
 * Only `name` (and, for `points`, `value`) had real checksley validation in the original
 * (`data-required`/`data-maxlength`); `is_closed`/`is_archived` are plain required selects
 * with an always-valid default, kept as `Validators.required` for parity. `color` is never
 * part of the `FormGroup` - like the original, it's mutated directly on the row's Model
 * instance via `tg-color-selector`'s `(selectColor)`, defaulting to `DEFAULT_COLOR` at save
 * time if still unset, same as the original's `if !value.color then value.color =
 * defaultColor`.
 *
 * The original's `form.setErrors(data)` (per-field backend errors) is simplified to
 * `confirm.notify("error", data._error_message)` only, same simplification already used
 * throughout this migration (see `AdminProjectProfileFormComponent` et al.).
 */
@Directive()
export abstract class ProjectValuesBaseComponent implements OnChanges, OnInit {
    @Input() project: any;
    @Input() resource!: string;
    @Input() type!: string;
    @Input() objName!: string;
    // The original's `ng-init="...; sectionName='ADMIN.PROJECT_VALUES_STATUS.EPIC_TITLE'"` -
    // a distinct translation key per call site, not derivable from `objName`/`type` alone
    // (e.g. the "status" variant's 3 callers each pass a different one for the same
    // component), so it stays its own input.
    @Input() sectionTitleKey!: string;

    values: any[] = [];
    valuesForm = new FormArray<FormGroup>([]);
    // `newValue` holds the "new row"'s fields that are NOT part of `newValueForm` (just
    // `color`, where applicable) - mirrors how an existing row's `color` also lives
    // directly on `value`, outside its `FormGroup`, mutated by `tg-color-selector` the
    // same way in both cases.
    newValue: any = {};
    newValueForm!: FormGroup;
    showAddForm = false;
    submittingNew = false;

    private lastProjectId: any;
    private maxValueOrder = 0;

    constructor(
        @Inject(AJS_TG_RESOURCES) protected rs: any,
        @Inject(AJS_REPO) protected repo: any,
        @Inject(AJS_CONFIRM) protected confirm: any,
        @Inject(AJS_ROOT_SCOPE) protected rootScope: any,
        @Inject(AJS_TRANSLATE) protected translate: any,
        @Inject(AJS_PROJECT_SERVICE) protected projectService: any,
        public errors: FormErrorMessageService,
    ) {}

    ngOnInit(): void {
        this.resetNewValue();
    }

    private resetNewValue(): void {
        this.newValue = this.newRowDefaults();
        this.newValueForm = this.buildRowGroup(this.newValue, true);
    }

    ngOnChanges(): void {
        if (this.project?.id && this.project.id !== this.lastProjectId) {
            this.lastProjectId = this.project.id;
            this.loadValues();
        }
    }

    /** Subclasses add their extra controls (`is_closed`, `is_archived`, `value`...) on top
     *  of the `name` control this base always creates. `isNew` distinguishes the "new row"
     *  form from an existing row's - `points` is the one variant where they're validated
     *  differently (the original's `name` input had `data-required` only on the new row,
     *  not on an existing one, see `ProjectValuesPointsComponent`). */
    protected abstract buildRowGroup(value: any, isNew?: boolean): FormGroup;

    /** Defaults for a brand new row, before the user has typed anything - mirrors the
     *  original's `initializeNewValue()` per variant. */
    protected abstract newRowDefaults(): any;

    protected nameControl(value: any): FormControl {
        return new FormControl(value?.name ?? "", [Validators.required, Validators.maxLength(255)]);
    }

    trackById(_index: number, value: any): any {
        return value.id;
    }

    private loadValues(): void {
        this.rs[this.resource].listValues(this.project.id, this.type).then((values: any[]) => {
            this.values = values;
            this.maxValueOrder = values.length ? _.maxBy(values, "order").order : 0;
            this.rebuildValuesForm();
        });
    }

    private rebuildValuesForm(): void {
        this.valuesForm = new FormArray<FormGroup>(this.values.map((v) => this.buildRowGroup(v)));
    }

    startEdit(value: any): void {
        this.values.forEach((v) => (v.editing = false));
        value.editing = true;
    }

    cancelEdit(value: any, index: number): void {
        value.editing = false;
        value.revert();
        this.valuesForm.setControl(index, this.buildRowGroup(value));
    }

    save(value: any, index: number): void {
        const group = this.valuesForm.at(index);

        if (group.invalid) {
            group.markAllAsTouched();
            return;
        }

        Object.assign(value, group.value);

        if ("color" in value && !value.color) {
            value.color = DEFAULT_COLOR;
        }

        this.repo.save(value).then(
            () => {
                value.editing = false;
                this.rootScope.$broadcast("admin:project-values:updated");
                this.projectService.fetchProject();
            },
            (data: any) => {
                if (data?._error_message) {
                    this.confirm.notify("error", data._error_message);
                }
            },
        );
    }

    showAdd(): void {
        this.showAddForm = true;
    }

    cancelAdd(): void {
        this.showAddForm = false;
        this.resetNewValue();
    }

    addNew(): void {
        if (this.submittingNew) {
            return;
        }

        if (this.newValueForm.invalid) {
            this.newValueForm.markAllAsTouched();
            return;
        }

        const payload = {
            ...this.newValue,
            ...this.newValueForm.value,
            project: this.project.id,
            order: this.maxValueOrder ? this.maxValueOrder + 1 : 1,
        };

        if ("color" in payload && !payload.color) {
            payload.color = DEFAULT_COLOR;
        }

        this.submittingNew = true;

        this.repo.create(this.type, payload).then(
            (data: any) => {
                this.submittingNew = false;
                this.showAddForm = false;
                this.values.push(data);
                this.maxValueOrder = data.order;
                this.valuesForm.push(this.buildRowGroup(data));
                this.resetNewValue();
                this.rootScope.$broadcast("admin:project-values:updated");
            },
            (data: any) => {
                this.submittingNew = false;

                if (data?._error_message) {
                    this.confirm.notify("error", data._error_message);
                }
            },
        );
    }

    deleteValue(value: any): void {
        const choices: Record<string, string> = {};

        this.values.forEach((option) => {
            if (value.id !== option.id) {
                choices[option.id] = option.name;
            }
        });

        if (!Object.keys(choices).length) {
            this.confirm.error(this.translate.instant("ADMIN.PROJECT_VALUES.ERROR_DELETE_ALL"));
            return;
        }

        const title = this.translate.instant("ADMIN.COMMON.TITLE_ACTION_DELETE_VALUE");
        const text = this.translate.instant("ADMIN.PROJECT_VALUES.REPLACEMENT");

        this.confirm.askChoice(title, value.name, choices, text).then((response: any) => {
            this.repo.remove(value, { moveTo: response.selected }).then(
                () => {
                    this.loadValues();
                    this.rootScope.$broadcast("admin:project-values:updated");
                    response.finish();
                },
                () => {
                    this.confirm.notify("error");
                },
            );
        });
    }

    drop(event: CdkDragDrop<any[]>): void {
        if (event.previousIndex === event.currentIndex) {
            return;
        }

        moveItemInArray(this.values, event.previousIndex, event.currentIndex);
        moveItemInArray(this.valuesForm.controls, event.previousIndex, event.currentIndex);

        this.values.forEach((v, i) => {
            v.order = i;
        });

        this.repo.saveAll(this.values).then(() => {
            this.rootScope.$broadcast("admin:project-values:updated");
        });
    }
}
