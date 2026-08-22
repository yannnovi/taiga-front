import { Component, Inject, Input } from "@angular/core";
import { AJS_CONFIRM, AJS_REPO, AJS_ROOT_SCOPE } from "../shared/ajs-tokens";

/**
 * Angular replacement for the form content of the admin "Default values" route
 * (app/partials/includes/modules/admin/default-values.jade) and for the AngularJS
 * `tgProjectDefaultValues` directive's submit behaviour
 * (app/coffee/modules/admin/project-profile.coffee) that used to sit on the route's outer
 * wrapper element with no template of its own - same pattern as `tgProjectProfile`
 * (see `AdminProjectProfileFormComponent`). `ProjectProfileController` (shared by every
 * admin project-profile sub-route) is untouched.
 *
 * The original called `.checksley(...)`/`form.validate()`, but none of these 8 `<select>`s
 * ever had a validation attribute - `validate()` was always trivially true. No `FormGroup`/
 * `Validators` here as a result, just plain `ngModel` on `project`'s fields, same as the
 * un-validated fields in `AdminProjectProfileFormComponent`.
 *
 * `admin:project-default-values:updated` is broadcast on success exactly like the original -
 * `tgProjectService.watchSignals()` (app/modules/services/project.service.coffee) listens
 * for it app-wide to refetch the shared project, so it must survive this port unchanged.
 */
@Component({
    selector: "tg-admin-project-default-values-form",
    templateUrl: "./admin-project-default-values-form.component.html",
})
export class AdminProjectDefaultValuesFormComponent {
    // Called directly from a still-AngularJS jade template - see
    // `AdminProjectProfileFormComponent`'s doc comment and MIGRATION.md: multi-word
    // inputs are bound via jade's `bind-x` attribute form, not `[x]`.
    @Input() project: any;
    @Input() epicStatusList: any[] = [];
    @Input() usStatusList: any[] = [];
    @Input() pointsList: any[] = [];
    @Input() taskStatusList: any[] = [];
    @Input() issueTypesList: any[] = [];
    @Input() issueStatusList: any[] = [];
    @Input() prioritiesList: any[] = [];
    @Input() severitiesList: any[] = [];

    submitting = false;

    constructor(
        @Inject(AJS_REPO) private repo: any,
        @Inject(AJS_CONFIRM) private confirm: any,
        @Inject(AJS_ROOT_SCOPE) private rootScope: any,
    ) {}

    submit(): void {
        if (this.submitting) {
            return;
        }

        this.submitting = true;

        this.repo.save(this.project).then(
            () => {
                this.submitting = false;
                this.confirm.notify("success");
                this.rootScope.$broadcast("admin:project-default-values:updated");
            },
            (data: any) => {
                this.submitting = false;

                if (data?._error_message) {
                    this.confirm.notify("error", data._error_message);
                }
            },
        );
    }
}
