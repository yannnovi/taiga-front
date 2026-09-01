import { Component } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { ProjectValuesBaseComponent } from "./project-values-base";

/**
 * Angular replacement for `project-points.jade` (name + numeric value, no color) - used by
 * the points admin section only. See `ProjectValuesBaseComponent` for the shared
 * add/edit/delete/reorder behaviour.
 *
 * The original's checksley `data-type="number"` (on both `value` inputs) is replicated with
 * `Validators.pattern`, surfaced via the shared `pattern` error message - there was no
 * dedicated `number` message key in the checksley config (see `FormErrorMessageService`).
 * Unlike the other 3 variants, the original had NO `data-required` on the existing-row
 * `name` input (only on the new-row one) - reproduced faithfully rather than "fixed", same
 * policy as every other quirk preserved elsewhere in this migration.
 */
@Component({
    selector: "tg-project-values-points",
    templateUrl: "./project-values-points.component.html",
})
export class ProjectValuesPointsComponent extends ProjectValuesBaseComponent {
    private static readonly NUMBER_PATTERN = /^-?\d+(\.\d+)?$/;

    protected buildRowGroup(value: any, isNew = false): FormGroup {
        return new FormGroup({
            name: new FormControl(value?.name ?? "", isNew ? Validators.required : []),
            value: new FormControl(value?.value ?? "", Validators.pattern(ProjectValuesPointsComponent.NUMBER_PATTERN)),
        });
    }

    protected newRowDefaults(): any {
        return { name: "", value: "" };
    }
}
