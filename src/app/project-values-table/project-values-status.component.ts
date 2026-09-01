import { Component } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { ProjectValuesBaseComponent } from "./project-values-base";

/**
 * Angular replacement for `project-status.jade` (name + color + is_closed + slug display) -
 * used by the epic, task, and issue status admin sections. See
 * `ProjectValuesBaseComponent` for the shared add/edit/delete/reorder behaviour.
 */
@Component({
    selector: "tg-project-values-status",
    templateUrl: "./project-values-status.component.html",
})
export class ProjectValuesStatusComponent extends ProjectValuesBaseComponent {
    protected buildRowGroup(value: any, isNew = false): FormGroup {
        return new FormGroup({
            name: this.nameControl(value),
            is_closed: new FormControl(value?.is_closed ?? false, Validators.required),
        });
    }

    protected newRowDefaults(): any {
        return { name: "", color: null, is_closed: false };
    }
}
