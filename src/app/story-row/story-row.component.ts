import { Component, Inject, Input, OnChanges } from "@angular/core";
import { AJS_AVATAR_SERVICE, AJS_PROJECT_LOGO_SERVICE } from "../shared/ajs-tokens";

declare const window: any;
declare const Immutable: any;

/**
 * Angular replacement for the AngularJS `tgStoryRow` directive
 * (app/modules/epics/dashboard/story-row/), downgraded in place under the same name - a
 * single user story row inside an epic's expanded row (itself inside `epics-table`, which
 * stays AngularJS - see MIGRATION.md's `*-sortable` exclusion). Previously rejected for
 * using `tg-nav` in its own template - now unblocked. Uses the already-migrated
 * `tg-belong-to-epics` natively.
 *
 * `tg-avatar`/`tg-project-logo-small-src` (both template-less) replicated inline, same
 * pattern as `duty`/`dropdown-project-list`/`profile-projects`.
 */
@Component({
    selector: "tg-story-row",
    templateUrl: "./story-row.component.html",
})
export class StoryRowComponent implements OnChanges {
    @Input() story: any;
    @Input() options: any;

    percentage = "0%";
    unassignedImageSrc = `${window._version}/images/unnamed.png`;

    constructor(
        @Inject(AJS_AVATAR_SERVICE) private avatarService: any,
        @Inject(AJS_PROJECT_LOGO_SERVICE) private projectLogoService: any,
    ) {}

    ngOnChanges(): void {
        this.calculateProgressBar();
    }

    private calculateProgressBar(): void {
        if (this.story.get("is_closed") === true) {
            this.percentage = "100%";
            return;
        }

        const totalTasks = this.story.get("tasks").size;
        const totalTasksCompleted = this.story.get("tasks").filter((it: any) => it.get("is_closed")).size;

        this.percentage = totalTasks === 0 ? "0%" : `${(totalTasksCompleted * 100) / totalTasks}%`;
    }

    getAvatarUrl(): string {
        return this.avatarService.getAvatar(this.story.get("assigned_to_extra_info")).url;
    }

    getProjectLogoUrl(): string {
        const project = Immutable.fromJS(this.story.get("project_extra_info"));
        const logoSmallUrl = project.get("logo_small_url");

        if (logoSmallUrl) {
            return logoSmallUrl;
        }

        return this.projectLogoService.getDefaultProjectLogo(project.get("slug"), project.get("id")).src;
    }

    getProjectLogoBg(): string {
        const project = Immutable.fromJS(this.story.get("project_extra_info"));

        if (project.get("logo_small_url")) {
            return "";
        }

        return this.projectLogoService.getDefaultProjectLogo(project.get("slug"), project.get("id")).color;
    }
}
