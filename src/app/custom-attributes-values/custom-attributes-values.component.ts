import { Component, Inject, Input, OnChanges, SimpleChanges } from "@angular/core";
import { AJS_REPO, AJS_ROOT_SCOPE, AJS_STORAGE, AJS_TG_RESOURCES } from "../shared/ajs-tokens";

declare const taiga: any;
declare const _: any;

/**
 * Angular replacement for the AngularJS `tgCustomAttributesValues` directive
 * (app/coffee/modules/common/custom-field-values.coffee), downgraded in place under the
 * same name - the collapsible "Custom Fields" section on US/epic/issue/task detail pages.
 *
 * The original required the built-in `ngModel` directive purely to get a `bindOnce` read of
 * the bound object's `.id` once it existed - replaced here with a plain `@Input() object`
 * and `ngOnChanges` (no two-way binding was ever used). Callers (still AngularJS templates,
 * `us-detail.jade`/`epic-detail.jade`/`issues-detail.jade`/`task-detail.jade`) switch from
 * `ng-model="x"` to `bind-object="x"`, same `bind-x` convention as everywhere else in this
 * migration.
 *
 * Owns the shared `customAttributesValues` object (`{id, attributes_values: {attrId:
 * value}}`) and the actual save call, same as the original's controller - each
 * `tg-custom-attribute-value` row delegates back to `updateAttributeValue` here rather than
 * saving independently, since they all mutate the same shared object.
 */
@Component({
    selector: "tg-custom-attributes-values",
    templateUrl: "./custom-attributes-values.component.html",
})
export class CustomAttributesValuesComponent implements OnChanges {
    @Input() object: any;
    @Input() type: string;
    @Input() project: any;
    @Input() requiredEditionPerm: string;

    customAttributes: any[] = [];
    customAttributesValues: any = null;
    collapsed = false;

    private objectId: any;
    private initialized = false;

    constructor(
        @Inject(AJS_REPO) private repo: any,
        @Inject(AJS_TG_RESOURCES) private rs: any,
        @Inject(AJS_ROOT_SCOPE) private rootScope: any,
        @Inject(AJS_STORAGE) private storage: any,
    ) {}

    ngOnChanges(changes: SimpleChanges): void {
        if (this.initialized || !this.object || !this.type) {
            return;
        }

        this.initialized = true;
        this.objectId = this.object.id;

        const hash = taiga.generateHash(["custom-attributes-collapsed", this.type]);

        this.collapsed = this.storage.get(hash) || false;

        this.loadCustomAttributesValues();
    }

    toggleCollapse(): void {
        this.collapsed = !this.collapsed;

        const hash = taiga.generateHash(["custom-attributes-collapsed", this.type]);

        this.storage.set(hash, this.collapsed);
    }

    getAttributeValue(attribute: any): any {
        const attributeValue = _.clone(attribute, false);

        attributeValue.value = this.customAttributesValues.attributes_values[attribute.id];

        return attributeValue;
    }

    updateAttributeValue = (attributeValue: any): Promise<any> => {
        const attributesValues = _.clone(this.customAttributesValues.attributes_values, true);

        attributesValues[attributeValue.id] = attributeValue.value;
        this.customAttributesValues.attributes_values = attributesValues;
        this.customAttributesValues.id = this.objectId;

        return this.repo.save(this.customAttributesValues).then((result: any) => {
            this.rootScope.$broadcast("custom-attributes-values:edit");

            return result;
        });
    };

    private loadCustomAttributesValues(): void {
        this.rs.customAttributesValues[this.type].get(this.objectId).then((customAttributesValues: any) => {
            this.customAttributes = this.project[`${this.type}_custom_attributes`];
            this.customAttributesValues = customAttributesValues;
        });
    }
}
