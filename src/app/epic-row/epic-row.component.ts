import { Component, Inject, Input, OnChanges } from "@angular/core";
import { AJS_AVATAR_SERVICE, AJS_CONFIRM, AJS_EPICS_SERVICE, AJS_PROJECT_SERVICE } from "../shared/ajs-tokens";

declare const window: any;

/**
 * Angular replacement for the AngularJS `tgEpicRow` directive
 * (app/modules/epics/dashboard/epic-row/), downgraded in place under the same name - a
 * single epic row inside `epics-table` (which stays AngularJS - see MIGRATION.md's
 * `*-sortable` exclusion). Previously rejected for using `tg-nav` in its own template -
 * now unblocked. Uses the already-migrated `tg-story-row` natively for its expanded user
 * story list.
 *
 * `tg-avatar` (template-less) replicated inline. `tg-isolate-click` (template-less,
 * app/modules/utils/isolate-click.directive.coffee - just `event.stopPropagation()`)
 * replicated inline as a plain `(click)="$event.stopPropagation()"`. `| orderBy:'order'`
 * (AngularJS built-in filter, over `vm.project.epic_statuses`) replicated as a plain
 * `.slice().sort(...)` on the getter. `updateAssignedTo`/`displayAssignedTo` kept for
 * fidelity - the original's own template never actually wired up a click handler to call
 * them either, dead code carried over as-is.
 */
@Component({
    selector: "tg-epic-row",
    templateUrl: "./epic-row.component.html",
})
export class EpicRowComponent implements OnChanges {
    @Input() epic: any;
    @Input() options: any;

    displayUserStories = false;
    displayAssignedTo = false;
    displayStatusList = false;
    loadingStatus = false;
    assignLoader = false;
    project: any;
    percentage = "0%";
    epicStories: any;
    unassignedImageSrc = `${window._version}/images/unnamed.png`;
    spinnerSrc = `${window._version}/svg/spinner-circle.svg`;

    constructor(
        @Inject(AJS_CONFIRM) private confirm: any,
        @Inject(AJS_PROJECT_SERVICE) private projectService: any,
        @Inject(AJS_EPICS_SERVICE) private epicsService: any,
        @Inject(AJS_AVATAR_SERVICE) private avatarService: any,
    ) {}

    ngOnChanges(): void {
        this.project = this.projectService.project.toJS();
        this.calculateProgressBar();
    }

    private calculateProgressBar(): void {
        if (this.epic.getIn(["status_extra_info", "is_closed"]) === true) {
            this.percentage = "100%";
            return;
        }

        const progress = this.epic.getIn(["user_stories_counts", "progress"]);
        const total = this.epic.getIn(["user_stories_counts", "total"]);

        this.percentage = total === 0 ? "0%" : `${(progress * 100) / total}%`;
    }

    canEditEpics(): boolean {
        return this.projectService.canEdit("modify_epic");
    }

    get orderedEpicStatuses(): any[] {
        const statuses = this.project?.epic_statuses || [];

        return [...statuses].sort((a: any, b: any) => a.order - b.order);
    }

    getAvatarUrl(): string {
        return this.avatarService.getAvatar(this.epic.get("assigned_to_extra_info")).url;
    }

    toggleUserStoryList(): void {
        if (!this.displayUserStories) {
            this.epicsService.listRelatedUserStories(this.epic).then(
                (userStories: any) => {
                    this.epicStories = userStories;
                    this.displayUserStories = true;
                },
                () => this.confirm.notify("error"),
            );
        } else {
            this.displayUserStories = false;
        }
    }

    updateStatus(statusId: any): void {
        this.displayStatusList = false;
        this.loadingStatus = true;

        this.epicsService
            .updateEpicStatus(this.epic, statusId)
            .catch(() => this.confirm.notify("error"))
            .finally(() => {
                this.loadingStatus = false;
            });
    }

    updateAssignedTo(member: any): void {
        this.assignLoader = true;

        this.epicsService
            .updateEpicAssignedTo(this.epic, member?.id || null)
            .catch(() => this.confirm.notify("error"))
            .then(() => {
                this.assignLoader = false;
            });
    }
}
