import { Component } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { ProjectValuesBaseComponent } from "./project-values-base";

/**
 * Angular replacement for `project-us-status.jade` (name + color + is_closed + is_archived +
 * slug display) - used by the user story status admin section only. See
 * `ProjectValuesBaseComponent` for the shared add/edit/delete/reorder behaviour.
 */
@Component({
    selector: "tg-project-values-us-status",
    templateUrl: "./project-values-us-status.component.html",
})
export class ProjectValuesUsStatusComponent extends ProjectValuesBaseComponent {
    protected buildRowGroup(value: any, isNew = false): FormGroup {
        return new FormGroup({
            name: this.nameControl(value),
            is_closed: new FormControl(value?.is_closed ?? false, Validators.required),
            is_archived: new FormControl(value?.is_archived ?? false, Validators.required),
        });
    }

    protected newRowDefaults(): any {
        return { name: "", color: null, is_closed: false, is_archived: false };
    }
}
