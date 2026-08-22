import { Component, ElementRef, Inject, Input, OnChanges, OnDestroy } from "@angular/core";
import { FormControl, FormGroup } from "@angular/forms";
import { pikadayValidator, strictUrlValidator } from "../shared/checksley-validators";
import {
    AJS_ATTACHMENTS_FULL_SERVICE,
    AJS_DATE_PICKER_CONFIG_SERVICE,
    AJS_SELECTED_TEXT,
    AJS_TRANSLATE,
} from "../shared/ajs-tokens";
import { FormErrorMessageService } from "../shared/form-error-message.service";

declare const moment: any;
declare const Pikaday: any;

const OBJECT_TYPE_MAP: Record<string, string> = {
    epics: "epic",
    userstories: "us",
    userstory: "us",
    issues: "issue",
    tasks: "task",
    epic: "epic",
    us: "us",
    issue: "issue",
    task: "task",
};

/**
 * Angular replacement for the AngularJS `tgCustomAttributeValue` directive
 * (app/coffee/modules/common/custom-field-values.coffee), downgraded in place under the
 * same name - a single custom-field row inside `tg-custom-attributes-values`
 * (`CustomAttributesValuesComponent`), view/edit toggle, one of 8 field types.
 *
 * `date`/`url` fields are the first live exercise of `pikadayValidator`/`strictUrlValidator`
 * outside a hand-picked test: the original's `data-pikaday`/`data-type="url"` checksley
 * attributes map to them directly. The `richtext` type doesn't go through the generic
 * `form`/submit path at all, same as the original - it renders `<tg-wysiwyg>` (already
 * wrapped, `TgWysiwygUpgradedDirective`) with its own dedicated save/cancel handlers,
 * replicating what the still-AngularJS `tgCustomFieldEditWysiwyg` composite directive
 * (`scope: true`, not independently wrappable) did inline against its ambient scope -
 * `uploadFiles` is ported the same way, using this component's own `project`/`attributeValue`
 * instead of a shared scope.
 */
@Component({
    selector: "tg-custom-attribute-value",
    templateUrl: "./custom-attribute-value.component.html",
})
export class CustomAttributeValueComponent implements OnChanges, OnDestroy {
    @Input() attributeValue: any;
    @Input() project: any;
    @Input() requiredEditionPerm: string;
    @Input() objectType: string;
    @Input() objectId: any;
    @Input() updateValue: (attributeValue: any) => Promise<any>;

    editing = false;
    submitting = false;
    form: FormGroup;

    private picker: any;
    private readonly prettyDate: string;

    constructor(
        private elementRef: ElementRef,
        @Inject(AJS_TRANSLATE) private translate: any,
        @Inject(AJS_SELECTED_TEXT) private selectedText: any,
        @Inject(AJS_DATE_PICKER_CONFIG_SERVICE) private datePickerConfigService: any,
        @Inject(AJS_ATTACHMENTS_FULL_SERVICE) private attachmentsFullService: any,
        public errors: FormErrorMessageService,
    ) {
        this.prettyDate = this.translate.instant("COMMON.PICKERDATE.FORMAT");
    }

    ngOnChanges(): void {
        // Same normalization the original did once at bootstrap - `tg-wysiwyg` (richtext
        // type) crashes on a `null` `content` input (`$scope.markdown.length ||
        // content.length` in wysiwyg.directive.coffee), it only ever expected `""`.
        if (this.attributeValue.value === null || this.attributeValue.value === undefined) {
            this.attributeValue.value = "";
        }
    }

    ngOnDestroy(): void {
        this.destroyPicker();
    }

    get isEditable(): boolean {
        return (
            !this.project.archived_code &&
            this.project.my_permissions.indexOf(this.requiredEditionPerm) > -1
        );
    }

    get displayValue(): any {
        const value = this.attributeValue.value;

        if (this.attributeValue.type === "date" && value) {
            return moment(value, "YYYY-MM-DD").format(this.prettyDate);
        }

        if (this.attributeValue.type === "number" && value) {
            return parseFloat(value);
        }

        return value;
    }

    onViewClick(): void {
        if (!this.isEditable || this.selectedText.get().length) {
            return;
        }

        this.startEdit();
    }

    startEdit(): void {
        if (!this.isEditable) {
            return;
        }

        this.editing = true;
        this.form = this.buildForm();

        setTimeout(() => {
            if (this.attributeValue.type === "date") {
                this.initPicker();
            }

            const field = this.elementRef.nativeElement.querySelector("input[name=value], textarea[name=value]");

            field?.focus();
            field?.select?.();
        }, 0);
    }

    cancel(): void {
        this.editing = false;
        this.destroyPicker();
    }

    submit(): void {
        if (this.submitting || this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.submitting = true;

        let value = this.form.value.value;

        if (this.attributeValue.type === "date" && value && moment(value, this.prettyDate).isValid()) {
            value = moment(value, this.prettyDate).format("YYYY-MM-DD");
        }

        if (this.attributeValue.type === "number" && value !== "" && value !== null) {
            value = parseFloat(value);
        }

        this.updateValue({ ...this.attributeValue, value }).then(() => {
            this.submitting = false;
            this.attributeValue.value = value;
            this.editing = false;
            this.destroyPicker();
        });
    }

    saveRichText(event: { text: string; cb: () => void }): void {
        this.updateValue({ ...this.attributeValue, value: event.text }).then(() => {
            this.attributeValue.value = event.text;
            event.cb();
            this.editing = false;
        });
    }

    cancelRichText(): void {
        this.editing = false;
    }

    uploadFile = (file: any, cb: (result: { default: any }) => void): any => {
        const objectType = OBJECT_TYPE_MAP[this.objectType] || this.objectType;

        return this.attachmentsFullService
            .addAttachment(this.project.id, String(this.objectId), objectType, file)
            .then((result: any) => {
                cb({ default: result.getIn(["file", "url"]) });
            });
    };

    private buildForm(): FormGroup {
        // None of the field types are actually required in the original (no
        // `data-required` in custom-attribute-value-edit.jade - only `date`/`url` carry
        // validation attributes, `data-pikaday`/`data-type="url"`) - clearing a custom
        // field back to empty is valid, not "fixed" here by adding a required rule.
        const validators: any[] = [];

        if (this.attributeValue.type === "date") {
            validators.push(pikadayValidator(this.prettyDate));
        } else if (this.attributeValue.type === "url") {
            validators.push(strictUrlValidator());
        }

        let value = this.attributeValue.value ?? (this.attributeValue.type === "checkbox" ? false : "");

        if (this.attributeValue.type === "date" && value) {
            value = moment(value, "YYYY-MM-DD").format(this.prettyDate);
        }

        return new FormGroup({
            value: new FormControl(value, validators),
        });
    }

    private initPicker(): void {
        const input = this.elementRef.nativeElement.querySelector("input[name=value]");

        if (!input) {
            return;
        }

        let selectedDate: any = null;
        const config = this.datePickerConfigService.get();

        this.picker = new Pikaday({
            ...config,
            field: input,
            onSelect: (date: any) => {
                selectedDate = date;
                this.form.get("value")?.setValue(input.value);
                this.form.get("value")?.markAsTouched();
            },
            onOpen: () => {
                if (selectedDate) {
                    this.picker.setDate(selectedDate);
                }
            },
        });
    }

    private destroyPicker(): void {
        this.picker?.destroy();
        this.picker = null;
    }
}
