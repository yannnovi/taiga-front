import { Component, Inject, Input, OnChanges } from "@angular/core";
import { AJS_CONFIRM, AJS_REPO, AJS_ROOT_SCOPE } from "../shared/ajs-tokens";
import { strictUrlValidator } from "../shared/checksley-validators";
import { FormErrorMessageService } from "../shared/form-error-message.service";

/**
 * Angular replacement for the AngularJS `tgProjectModules` directive
 * (app/coffee/modules/admin/project-profile.coffee) - the "Modules" admin route form
 * (app/partials/admin/admin-project-modules.jade, whose markup lived directly in the route
 * template rather than a separate `include`, unlike `tgProjectProfile`/
 * `tgProjectDefaultValues`). `ProjectProfileController` is untouched.
 *
 * The 5 "direct active" module toggles (epics/backlog/kanban/issues/wiki) auto-submit on
 * change, same as the original's `.module-activation.module-direct-active input` change
 * handler. The backlog module's extra numeric fields (`total_milestones`/
 * `total_story_points`) do NOT auto-submit - only its own "save" link does, same as the
 * original (they aren't inside a `.module-direct-active` block).
 *
 * The videoconference module doesn't auto-submit on activation either (its checkbox isn't
 * `.module-direct-active`) - only on *deactivation* (mirroring the original's
 * `$scope.$watch("isVideoconferenceActivated", ...)`, which reset the videoconference
 * fields and saved only when transitioning from on to off) or via its own "save" link.
 * `isVideoconferenceActivated` is re-derived from `project.videoconferences` whenever
 * `project` itself changes (the original's second `$watch("project", ...)`), in
 * `ngOnChanges`.
 *
 * Only the "custom" videoconference type had real checksley validation
 * (`data-required`/`data-url` on `videoconferences_extra_data`) - reproduced as a plain
 * check in `submit()` using the shared `strictUrlValidator`, rather than a full
 * `FormGroup`, since it's the only validated field on this whole form.
 *
 * `onVideoconferenceTypeChange` mirrors the original's
 * `$scope.$watch("project.videoconferences", ...)`: switching the `<select>` between two
 * different non-empty providers clears the now-irrelevant `videoconferences_extra_data`
 * left over from the previous one.
 *
 * The original's `keydown` handler blocking the space key on `.videoconference-attributes`
 * inputs is preserved as-is even though its rationale isn't documented anywhere in the
 * original - not obviously dead, so not dropped.
 */
@Component({
    selector: "tg-admin-project-modules-form",
    templateUrl: "./admin-project-modules-form.component.html",
})
export class AdminProjectModulesFormComponent implements OnChanges {
    @Input() project: any;

    isVideoconferenceActivated = false;
    videoconferenceError: string | null = null;

    videoconferenceOptions = [
        { id: "whereby-com", name: "ADMIN.MODULES.WHEREBYCOM_CHAT_ROOM" },
        { id: "jitsi", name: "ADMIN.MODULES.JITSI_CHAT_ROOM" },
        { id: "talky", name: "ADMIN.MODULES.TALKY_CHAT_ROOM" },
        { id: "custom", name: "ADMIN.MODULES.CUSTOM_CHAT_ROOM" },
    ];

    constructor(
        @Inject(AJS_REPO) private repo: any,
        @Inject(AJS_CONFIRM) private confirm: any,
        @Inject(AJS_ROOT_SCOPE) private rootScope: any,
        public errors: FormErrorMessageService,
    ) {}

    private previousVideoconferenceType: string | null = null;

    ngOnChanges(): void {
        this.isVideoconferenceActivated = !!this.project?.videoconferences;
        this.previousVideoconferenceType = this.project?.videoconferences || null;
    }

    onVideoconferenceTypeChange(): void {
        const newVal = this.project.videoconferences;

        if (this.previousVideoconferenceType && newVal && newVal !== this.previousVideoconferenceType) {
            this.project.videoconferences_extra_data = "";
        }

        this.previousVideoconferenceType = newVal || null;
    }

    onVideoconferenceToggle(checked: boolean): void {
        const wasActivated = this.isVideoconferenceActivated;

        this.isVideoconferenceActivated = checked;

        if (!checked) {
            this.project.videoconferences = null;
            this.project.videoconferences_extra_data = "";
            this.videoconferenceError = null;
            this.previousVideoconferenceType = null;

            if (wasActivated) {
                this.submit();
            }
        }
    }

    onVideoconferenceKeydown(event: KeyboardEvent): boolean {
        return event.key !== " ";
    }

    submit(): void {
        if (this.isVideoconferenceActivated && this.project.videoconferences === "custom") {
            const value = this.project.videoconferences_extra_data;

            if (!value) {
                this.videoconferenceError = this.errors.getMessage({ required: true });
                return;
            }

            if (strictUrlValidator()({ value } as any)) {
                this.videoconferenceError = this.errors.getMessage({ strictUrl: true });
                return;
            }
        }

        this.videoconferenceError = null;

        this.repo.save(this.project).then(
            () => {
                this.rootScope.$broadcast("admin:project-modules:updated");
                this.confirm.notify("success");
            },
            (data: any) => {
                if (data?._error_message) {
                    this.confirm.notify("error", data._error_message);
                }
            },
        );
    }
}
