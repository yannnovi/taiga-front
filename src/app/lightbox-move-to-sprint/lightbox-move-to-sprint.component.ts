import { Component, Inject, Input, OnChanges } from "@angular/core";
import {
    AJS_CONFIRM,
    AJS_LIGHTBOX_SERVICE,
    AJS_PROJECT_SERVICE,
    AJS_ROOT_SCOPE,
    AJS_TG_RESOURCES,
    AJS_TRANSLATE,
} from "../shared/ajs-tokens";

declare const _: any;

/**
 * Angular replacement for the AngularJS `tgLbMoveToSprint` directive
 * (app/modules/components/move-to-sprint/move-to-sprint-lb/), downgraded in place under
 * the same name - the lightbox opened by the already-migrated `MoveToSprintComponent`.
 * That caller's `lightboxFactory.create` attrs switch from plain `sprint`/`open-items` to
 * `bind-sprint`/`bind-open-items`.
 */
@Component({
    selector: "tg-lb-move-to-sprint",
    templateUrl: "./lightbox-move-to-sprint.component.html",
})
export class LightboxMoveToSprintComponent implements OnChanges {
    @Input() sprint: any;
    @Input() openItems: any;

    projectId: any;
    loading = false;
    someSelected = false;
    selectedSprintId: any = null;
    typesSelected: { uss: boolean; tasks: boolean; issues: boolean } = { uss: false, tasks: false, issues: false };
    itemsToMove: Record<string, any> = {};
    sprints: any;
    hasManyItemTypes = false;
    ussCount = 0;
    tasksCount = 0;
    issuesCount = 0;

    constructor(
        @Inject(AJS_ROOT_SCOPE) private rootScope: any,
        @Inject(AJS_TG_RESOURCES) private rs: any,
        @Inject(AJS_PROJECT_SERVICE) private projectService: any,
        @Inject(AJS_TRANSLATE) private translate: any,
        @Inject(AJS_LIGHTBOX_SERVICE) private lightboxService: any,
        @Inject(AJS_CONFIRM) private confirm: any,
    ) {
        this.projectId = this.projectService.project.get("id");
        this.loadSprints();
    }

    ngOnChanges(): void {
        if (!this.openItems) {
            return;
        }

        this.init(this.openItems);
    }

    private init(openItems: any): void {
        this.hasManyItemTypes = _.size(openItems) > 1;

        this.ussCount = parseInt(openItems.uss?.length, 10);
        this.updateSelected("uss", this.ussCount > 0);

        this.tasksCount = parseInt(openItems.tasks?.length, 10);
        this.updateSelected("tasks", this.tasksCount > 0);

        this.issuesCount = parseInt(openItems.issues?.length, 10);
        this.updateSelected("issues", this.issuesCount > 0);
    }

    private loadSprints(): void {
        this.rs.sprints.list(this.projectId, { closed: false }).then((data: any) => {
            this.sprints = _.filter(data.milestones, (x: any) => x.id !== this.sprint.id);
        });
    }

    updateSelected(itemType: "uss" | "tasks" | "issues", value: boolean): void {
        this.typesSelected[itemType] = value;
        this.someSelected = _.some(this.typesSelected);

        if (value === true) {
            this.itemsToMove[itemType] = this.openItems[itemType];
        } else if (this.itemsToMove[itemType]) {
            delete this.itemsToMove[itemType];
        }
    }

    submit(): void {
        const itemsNotMoved: Record<string, boolean> = {};

        _.map(this.openItems, (itemsList: any, itemsType: string) => {
            if (!this.itemsToMove[itemsType]) {
                itemsNotMoved[itemsType] = true;
            }
        });

        this.loading = true;

        this.moveItems().then(() => {
            this.rootScope.$broadcast("taskboard:items:move", this.typesSelected);
            this.lightboxService.closeAll();
            this.loading = false;

            if (_.size(itemsNotMoved) > 0) {
                this.displayWarning(itemsNotMoved);
            }
        });
    }

    private moveItems(): any {
        const promises = [];

        if (this.itemsToMove["uss"]) {
            promises.push(
                this.rs.sprints.moveUserStoriesMilestone(
                    this.sprint.id,
                    this.projectId,
                    this.selectedSprintId,
                    this.itemsToMove["uss"],
                ),
            );
        }

        if (this.itemsToMove["tasks"]) {
            promises.push(
                this.rs.sprints.moveTasksMilestone(
                    this.sprint.id,
                    this.projectId,
                    this.selectedSprintId,
                    this.itemsToMove["tasks"],
                ),
            );
        }

        if (this.itemsToMove["issues"]) {
            promises.push(
                this.rs.sprints.moveIssuesMilestone(
                    this.sprint.id,
                    this.projectId,
                    this.selectedSprintId,
                    this.itemsToMove["issues"],
                ),
            );
        }

        return Promise.all(promises);
    }

    private displayWarning(itemsNotMoved: Record<string, boolean>): void {
        const action = this.translate.instant("COMMON.I_GET_IT");
        let title: string;
        let desc: string;

        if (_.size(itemsNotMoved) === 1 && itemsNotMoved["issues"] === true) {
            title = this.translate.instant("TASKBOARD.MOVE_TO_SPRINT.WARNING_ISSUES_NOT_MOVED_TITLE");
            desc = this.translate.instant("TASKBOARD.MOVE_TO_SPRINT.WARNING_ISSUES_NOT_MOVED");
        } else {
            let totalItemsMoved = 0;

            _.map(this.itemsToMove, (itemsList: any) => {
                totalItemsMoved += itemsList.length;
            });

            title = this.translate.instant(
                "TASKBOARD.MOVE_TO_SPRINT.WARNING_SPRINT_STILL_OPEN_TITLE",
                { total: totalItemsMoved },
                "messageformat",
            );
            desc = this.translate.instant("TASKBOARD.MOVE_TO_SPRINT.WARNING_SPRINT_STILL_OPEN", {
                sprintName: this.sprint?.name,
            });
        }

        this.confirm.success(title, desc, null, action);
    }
}
