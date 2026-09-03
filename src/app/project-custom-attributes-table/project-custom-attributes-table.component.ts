import { Component, Inject, Input, OnChanges } from "@angular/core";
import { CdkDragDrop, moveItemInArray } from "@angular/cdk/drag-drop";
import { FormArray, FormControl, FormGroup, Validators } from "@angular/forms";
import { AJS_CONFIRM, AJS_REPO, AJS_ROOT_SCOPE, AJS_TG_RESOURCES, AJS_TRANSLATE } from "../shared/ajs-tokens";
import { FormErrorMessageService } from "../shared/form-error-message.service";

declare const _: any;

/** See taiga-back/taiga/projects/custom_attributes/choices.py. */
const TYPE_CHOICES = [
    { key: "text", name: "ADMIN.CUSTOM_FIELDS.FIELD_TYPE_TEXT" },
    { key: "multiline", name: "ADMIN.CUSTOM_FIELDS.FIELD_TYPE_MULTI" },
    { key: "richtext", name: "ADMIN.CUSTOM_FIELDS.FIELD_TYPE_RICHTEXT" },
    { key: "date", name: "ADMIN.CUSTOM_FIELDS.FIELD_TYPE_DATE" },
    { key: "url", name: "ADMIN.CUSTOM_FIELDS.FIELD_TYPE_URL" },
    { key: "dropdown", name: "ADMIN.CUSTOM_FIELDS.FIELD_TYPE_DROPDOWN" },
    { key: "checkbox", name: "ADMIN.CUSTOM_FIELDS.FIELD_TYPE_CHECKBOX" },
    { key: "number", name: "ADMIN.CUSTOM_FIELDS.FIELD_TYPE_NUMBER" },
];

/**
 * Angular replacement for the AngularJS `tgProjectCustomAttributes` directive/
 * `ProjectCustomAttributesController` (app/coffee/modules/admin/project-profile.coffee) -
 * the custom-field-definition admin CRUD (`admin-custom-attributes.jade` +
 * `admin-custom-attributes-extra.jade`/`admin-custom-attributes-new-extra.jade`), reused
 * for the epic/US/task/issue sections of `admin-project-values-custom-fields.jade`.
 *
 * Only `name` (required, 64 chars) had real checksley validation for both the attribute
 * itself and its dropdown "extra" options - `description`/`type` were never validated. The
 * "extra" option inputs are a special case worth calling out: in the original template
 * `div.custom-field-extra` (holding those inputs) is a **sibling** of `form.js-form`, not
 * nested inside it - `formEl.checksley()` (`formEl` = `.closest("form")` from the click
 * target) can therefore never see them despite their own `data-required`/`data-maxlength`
 * attributes. Dead validation in the original, not reproduced here - extra options are
 * plain unvalidated strings, matching actual (not apparent) behaviour.
 *
 * `attr.setAttr("extra", attr.extra)` before every save mirrors the original: `extra` is a
 * plain array mutated in place (push/splice/reorder), which the `Model` class's
 * property-accessor-based change tracking (see `app/coffee/modules/base/model.coffee`)
 * can't observe on its own - `setAttr` forces it to register as modified.
 *
 * Two independent levels of `@angular/cdk/drag-drop` reorder, same as the original's two
 * independent `dragula` instances: the attribute list itself (`dropAttr`), and, only for
 * currently-expanded `dropdown`-type attributes, that attribute's own "extra" options list
 * (`dropExtraOption`) - never a shared `cdkDropListGroup`, since the original never allowed
 * dragging between an attribute's options and the attribute list itself, or between two
 * different attributes' options.
 *
 * The create form is forced open (and its own +/cancel buttons hidden) whenever a section
 * has zero custom attributes yet - mirrors the original's `$scope.$watch("customAttributes",
 * ...)` - recomputed every time `loadCustomAttributes()` runs, not just once.
 */
@Component({
    selector: "tg-project-custom-attributes-table",
    templateUrl: "./project-custom-attributes-table.component.html",
})
export class ProjectCustomAttributesTableComponent implements OnChanges {
    @Input() project: any;
    @Input() type!: string;
    @Input() sectionTitleKey!: string;
    @Input() addButtonTitleKey!: string;

    typeChoices = TYPE_CHOICES;

    customAttributes: any[] = [];
    attrsForm = new FormArray<FormGroup>([]);
    newAttr: any = {};
    newAttrForm!: FormGroup;
    isExtraVisible: Record<number, boolean> = {};
    showAddForm = false;

    private maxOrder = 0;
    private lastProjectId: any;

    constructor(
        @Inject(AJS_TG_RESOURCES) private rs: any,
        @Inject(AJS_REPO) private repo: any,
        @Inject(AJS_CONFIRM) private confirm: any,
        @Inject(AJS_ROOT_SCOPE) private rootScope: any,
        @Inject(AJS_TRANSLATE) private translate: any,
        public errors: FormErrorMessageService,
    ) {
        this.resetNewAttr();
    }

    ngOnChanges(): void {
        if (this.project?.id && this.project.id !== this.lastProjectId) {
            this.lastProjectId = this.project.id;
            this.loadCustomAttributes();
        }
    }

    trackById(_index: number, attr: any): any {
        return attr.id;
    }

    /** Mirrors the original's `ng-switch on="attr.type"` (defaulting to the "text" label for
     *  any unrecognized/missing type, same as its `ng-switch-default`). */
    typeLabel(type: string): string {
        return TYPE_CHOICES.find((choice) => choice.key === type)?.name ?? TYPE_CHOICES[0].name;
    }

    private resetNewAttr(): void {
        this.newAttr = {};
        this.newAttrForm = new FormGroup({
            name: new FormControl("", [Validators.required, Validators.maxLength(64)]),
        });
    }

    private loadCustomAttributes(): void {
        this.rs.customAttributes[this.type].list(this.project.id).then((attrs: any[]) => {
            attrs.forEach((attr) => this.parseAttrExtra(attr));

            this.customAttributes = attrs;
            this.maxOrder = attrs.length ? _.maxBy(attrs, "order").order : 0;
            this.attrsForm = new FormArray<FormGroup>(attrs.map((attr) => this.buildAttrForm(attr)));
            this.showAddForm = attrs.length === 0;
        });
    }

    private parseAttrExtra(attr: any): void {
        if (attr.type === "dropdown" && !attr.extra) {
            attr.extra = [""];
        }
    }

    private buildAttrForm(attr: any): FormGroup {
        return new FormGroup({
            name: new FormControl(attr.name, [Validators.required, Validators.maxLength(64)]),
        });
    }

    toggleExtraVisible(id: number): void {
        this.isExtraVisible[id] = !this.isExtraVisible[id];
    }

    onTypeChange(attr: any, isNewRow: boolean): void {
        if (attr.type === "dropdown" && !(attr.extra && attr.extra.length)) {
            attr.extra = [""];
            this.isExtraVisible[isNewRow ? -1 : attr.id] = true;
        }
    }

    addExtraOption(extra: string[]): void {
        extra.push("");
    }

    removeExtraOption(extra: string[], index: number): void {
        extra.splice(index, 1);
    }

    dropExtraOption(attr: any, event: CdkDragDrop<string[]>): void {
        if (event.previousIndex === event.currentIndex) {
            return;
        }

        moveItemInArray(attr.extra, event.previousIndex, event.currentIndex);
        attr.setAttr("extra", attr.extra);

        this.repo.save(attr).then(() => {
            this.confirm.notify("success");
        });
    }

    startEdit(attr: any): void {
        attr.editing = true;
        // Mirrors the original's `showEditForm`, which always revealed the extra-options
        // section on entering edit mode, not just via the view-mode toggle arrow - a no-op
        // for non-dropdown attrs (the section stays gated on `attr.type === 'dropdown'`
        // regardless).
        this.isExtraVisible[attr.id] = true;
    }

    cancelEdit(attr: any, index: number): void {
        attr.editing = false;
        attr.revert();
        this.attrsForm.setControl(index, this.buildAttrForm(attr));
    }

    save(attr: any, index: number): void {
        const group = this.attrsForm.at(index);

        if (group.invalid) {
            group.markAllAsTouched();
            return;
        }

        Object.assign(attr, group.value);
        attr.setAttr("extra", attr.extra);

        this.repo.save(attr).then(
            () => {
                attr.editing = false;
                this.confirm.notify("success");
                this.rootScope.$broadcast("admin:project-custom-attributes:updated");
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
        this.resetNewAttr();

        if (this.customAttributes.length) {
            this.showAddForm = false;
        }
    }

    addNew(): void {
        if (this.newAttrForm.invalid) {
            this.newAttrForm.markAllAsTouched();
            return;
        }

        const payload = {
            ...this.newAttr,
            ...this.newAttrForm.value,
            project: this.project.id,
            order: this.maxOrder ? this.maxOrder + 1 : 1,
        };

        this.repo.create(`custom-attributes/${this.type}`, payload).then(
            () => {
                this.confirm.notify("success");
                this.rootScope.$broadcast("admin:project-custom-attributes:updated");
                this.resetNewAttr();
                this.loadCustomAttributes();
            },
            (data: any) => {
                if (data?._error_message) {
                    this.confirm.notify("error", data._error_message);
                }
            },
        );
    }

    deleteAttribute(attr: any): void {
        const title = this.translate.instant("COMMON.CUSTOM_ATTRIBUTES.DELETE");
        const text = this.translate.instant("COMMON.CUSTOM_ATTRIBUTES.CONFIRM_DELETE");

        this.confirm.askDelete(title, text, attr.name).then((response: any) => {
            this.repo.remove(attr).then(
                () => {
                    this.loadCustomAttributes();
                    this.rootScope.$broadcast("admin:project-custom-attributes:updated");
                    response.finish();
                },
                () => {
                    this.confirm.notify("error", null, `We have not been able to delete '${attr.name}'.`);
                },
            );
        });
    }

    dropAttr(event: CdkDragDrop<any[]>): void {
        if (event.previousIndex === event.currentIndex) {
            return;
        }

        moveItemInArray(this.customAttributes, event.previousIndex, event.currentIndex);
        moveItemInArray(this.attrsForm.controls, event.previousIndex, event.currentIndex);

        this.customAttributes.forEach((attr, i) => {
            attr.order = i;
        });

        this.repo.saveAll(this.customAttributes).then(() => {
            this.rootScope.$broadcast("admin:project-custom-attributes:updated");
        });
    }
}
