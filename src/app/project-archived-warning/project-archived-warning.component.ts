import { Component, Inject } from "@angular/core";
import { AJS_PROJECT_SERVICE } from "../shared/ajs-tokens";

/**
 * Angular replacement for the AngularJS `tgProjectArchivedWarning` directive
 * (app/modules/components/project-archived-warning/). Downgraded in place under the same
 * directive name. Already used as an element (`tg-project-archived-warning`) by both its
 * callers (project.jade, epics-dashboard.jade), so no call-syntax change needed there -
 * unlike profile-hints, this one was never an attribute usage.
 */
@Component({
    selector: "tg-project-archived-warning",
    templateUrl: "./project-archived-warning.component.html",
})
export class ProjectArchivedWarningComponent {
    isArchived: boolean | null;

    constructor(@Inject(AJS_PROJECT_SERVICE) projectService: any) {
        this.isArchived = projectService.isArchived() ?? null;
    }
}
