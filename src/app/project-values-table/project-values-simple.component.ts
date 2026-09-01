import { Component } from "@angular/core";
import { FormGroup } from "@angular/forms";
import { ProjectValuesBaseComponent } from "./project-values-base";

/**
 * Angular replacement for `project-types.jade` (name + color only) - used by the
 * severities, priorities, and issue-types admin sections. See `ProjectValuesBaseComponent`
 * for the shared add/edit/delete/reorder behaviour.
 */
@Component({
    selector: "tg-project-values-simple",
    templateUrl: "./project-values-simple.component.html",
})
export class ProjectValuesSimpleComponent extends ProjectValuesBaseComponent {
    get addNewElementLabelKey(): string {
        return `ADMIN.PROJECT_VALUES_${this.objName.toUpperCase()}.ACTION_ADD`;
    }

    protected buildRowGroup(value: any, isNew = false): FormGroup {
        return new FormGroup({ name: this.nameControl(value) });
    }

    protected newRowDefaults(): any {
        return { name: "", color: null };
    }
}
