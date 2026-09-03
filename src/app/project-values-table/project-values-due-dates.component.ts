import { Component } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { ProjectValuesBaseComponent } from "./project-values-base";

const DIGITS_PATTERN = /^\d+$/;

/**
 * Angular replacement for `project-due-date-status.jade` + the AngularJS
 * `tgProjectDueDatesValues` directive/`ProjectDueDatesValuesController`
 * (app/coffee/modules/admin/project-profile.coffee) - used by the US/task/issue
 * "due date status" admin sections. Extends `ProjectValuesBaseComponent` (the original
 * likewise layered `ProjectDueDatesValues`/`ProjectDueDatesValuesController` on top of the
 * generic `ProjectValuesDirective`/`ProjectValuesController`), overriding 3 behaviours:
 *
 * - **Auto-provisioning**: a project with no due-date statuses yet gets a starter set
 *   created via the resource's own `createDefaultValues` API (`createDefaultValues()`
 *   override), same as the original's `ProjectDueDatesValuesController#createDefaultValues`.
 * - **Derived fields**: `days_to_due_abs`/`sign` are UI-only, derived from the API's signed
 *   `days_to_due` on load (`onValuesLoaded`) and recombined back into `days_to_due` right
 *   before saving (`beforeSave`) - exactly mirroring the original's `displayValues()`/
 *   `_setDaysToDue()`. Neither lives in the row's `FormGroup`, same treatment as `color`
 *   elsewhere in this file (mutated directly on the row, not validated as such).
 * - **Simpler delete**: no reassignment dialog (`askDelete`, not `askChoice` - a due-date
 *   status can be freely removed, nothing points to it the way US/task/issue statuses do)
 *   and the `by_default` row can't be deleted at all (its delete icon isn't rendered,
 *   matching the original's `ng-if="!value.by_default"`).
 *
 * The `by_default` row also hides its day-threshold/before-after fields entirely in edit
 * mode (`*ngIf="!value.by_default"` in the template, matching the original) - it only ever
 * has a name and a color.
 *
 * Only `name` (required, 255 chars) and, on the *new* row only, `days_to_due_abs` (required
 * + digits) had real checksley validation - an existing row's `days_to_due_abs` has no
 * `data-required` in the original (asymmetric, same kind of quirk already seen on
 * `ProjectValuesPointsComponent`, reproduced rather than "fixed"). Checksley's
 * `data-type="digits"` (non-negative integers only, no decimals/sign) is reproduced via
 * `Validators.pattern(/^\d+$/)`.
 */
@Component({
    selector: "tg-project-values-due-dates",
    templateUrl: "./project-values-due-dates.component.html",
})
export class ProjectValuesDueDatesComponent extends ProjectValuesBaseComponent {
    protected buildRowGroup(value: any, isNew = false): FormGroup {
        return new FormGroup({
            name: this.nameControl(value),
            days_to_due_abs: new FormControl(
                value?.days_to_due_abs ?? null,
                isNew ? [Validators.required, Validators.pattern(DIGITS_PATTERN)] : Validators.pattern(DIGITS_PATTERN),
            ),
        });
    }

    protected newRowDefaults(): any {
        return { name: "", color: null, days_to_due_abs: null, sign: 1 };
    }

    protected override createDefaultValues(): boolean {
        if (typeof this.rs[this.resource].createDefaultValues !== "function") {
            return false;
        }

        this.rs[this.resource].createDefaultValues(this.project.id, this.type).then((response: any) => {
            this.rootScope.$broadcast("admin:project-values:updated");
            this.applyLoadedValues(response.data || []);
        });

        return true;
    }

    protected override onValuesLoaded(values: any[]): any[] {
        values.forEach((value) => {
            value.days_to_due_abs = value.days_to_due != null ? Math.abs(value.days_to_due) : null;
            value.sign = value.days_to_due >= 0 ? 1 : -1;
        });

        return values;
    }

    protected override beforeSave(value: any): void {
        value.days_to_due = (value.days_to_due_abs || 0) * (value.sign || 1);
    }

    override deleteValue(value: any): void {
        const title = this.translate.instant("LIGHTBOX.ADMIN_DUE_DATES.TITLE_ACTION_DELETE_DUE_DATE");
        const subtitle = this.translate.instant("LIGHTBOX.ADMIN_DUE_DATES.SUBTITLE_ACTION_DELETE_DUE_DATE", {
            due_date_status_name: value.name,
        });

        this.confirm.askDelete(title, subtitle).then((response: any) => {
            this.repo.remove(value).then(
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
}
