import { Component, ElementRef, Inject, Input } from "@angular/core";
import {
    AJS_CONFIRM,
    AJS_LIGHTBOX_SERVICE,
    AJS_QUEUE_MODEL_TRANSFORMATION,
    AJS_ROOT_SCOPE,
    AJS_TG_RESOURCES,
    AJS_TRANSLATE,
} from "../shared/ajs-tokens";

declare const $: any;
declare const taiga: any;

/**
 * Angular replacement for `tgAssignSprintToIssueButton` (`issues/detail.coffee`), same name,
 * on the issue detail sidebar. The original read `$scope.projectId`/`project` ambiently and
 * used `tg-search-list` (AngularJS, `ng-model`) for the sprint picker; the picker is inlined
 * here - same behaviour as `tg-search-list` for sprints: text filter on name/start/finish,
 * closed sprints hidden behind a "show closed sprints" toggle, click to (un)select - the
 * same choice `LightboxCreateEditComponent` already made for the issue picker.
 *
 * Attach: pick a sprint and save through `$tgQueueModelTransformation`; detach: confirm
 * first. Both broadcast `assign-sprint-to-issue:success` (milestone id or null), which
 * `IssueDetailController` listens to.
 */
@Component({
    selector: "tg-assign-sprint-to-issue-button",
    templateUrl: "./assign-sprint-to-issue-button.component.html",
})
export class AssignSprintToIssueButtonComponent {
    @Input() item: any;
    @Input() project: any;

    milestones: any[] = [];
    searchText = "";
    showClosed = false;
    selectedSprint: any = null;
    detachHover = false;
    saving = false;

    readonly spinnerSrc = `${(window as any)._version}/svg/spinner-circle.svg`;

    constructor(
        private elementRef: ElementRef<HTMLElement>,
        @Inject(AJS_TG_RESOURCES) private rs: any,
        @Inject(AJS_TRANSLATE) private translate: any,
        @Inject(AJS_LIGHTBOX_SERVICE) private lightboxService: any,
        @Inject(AJS_QUEUE_MODEL_TRANSFORMATION) private modelTransform: any,
        @Inject(AJS_CONFIRM) private confirm: any,
        @Inject(AJS_ROOT_SCOPE) private rootScope: any,
    ) {}

    /** Was `tg-check-permission="modify_issue"` on both buttons. */
    get canModify(): boolean {
        return !!this.project && this.project.my_permissions.indexOf("modify_issue") !== -1;
    }

    private lightbox(): any {
        return $(this.elementRef.nativeElement).find(".lightbox-assign-sprint-to-issue");
    }

    private normalize(value: any): string {
        return taiga.normalizeString(`${value ?? ""}`.toUpperCase());
    }

    get visibleMilestones(): any[] {
        const needle = this.normalize(this.searchText);

        return this.milestones.filter((m) => {
            if (!this.showClosed && m.closed) {
                return false;
            }

            if (!needle) {
                return true;
            }

            return [m.name, m.estimated_start, m.estimated_finish].some((v) => this.normalize(v).includes(needle));
        });
    }

    toggleShowClosed(event: Event): void {
        event.preventDefault();
        this.showClosed = !this.showClosed;

        if (!this.showClosed && this.selectedSprint?.closed) {
            this.selectedSprint = null;
        }
    }

    choose(milestone: any): void {
        this.selectedSprint = this.selectedSprint?.id === milestone.id ? null : milestone;
    }

    onSearchChange(): void {
        if (this.selectedSprint && !this.visibleMilestones.find((m) => m.id === this.selectedSprint.id)) {
            this.selectedSprint = null;
        }
    }

    openAttach(event: Event): void {
        event.preventDefault();
        event.stopPropagation();

        this.rs.sprints.list(this.project.id, null).then((data: any) => {
            this.milestones = data.milestones;
            this.searchText = "";
            this.showClosed = false;
            this.selectedSprint = this.milestones.find((m) => m.id === this.item.milestone) || null;
            this.lightboxService.open(this.lightbox());
        });
    }

    closeLightbox(event?: Event): void {
        event?.preventDefault();
        this.lightboxService.close(this.lightbox());
    }

    save(event: Event): void {
        event.preventDefault();

        if (!this.selectedSprint || this.saving) {
            return;
        }

        const sprintId = this.selectedSprint.id;
        this.saving = true;

        this.modelTransform
            .save((issue: any) => {
                this.setMilestone(issue, sprintId);
                return issue;
            })
            .then(
                () => {
                    this.saving = false;
                    this.closeLightbox();
                    this.rootScope.$broadcast("assign-sprint-to-issue:success", sprintId);
                },
                () => {
                    this.saving = false;
                    this.confirm.notify("error");
                },
            );
    }

    detach(event: Event): void {
        event.preventDefault();
        event.stopPropagation();

        this.rs.sprints.list(this.project.id, null).then((data: any) => {
            const currentSprint = data.milestones.find((m: any) => m.id === this.item.milestone);
            const title = this.translate.instant("ISSUES.CONFIRM_DETACH_FROM_SPRINT.TITLE");
            const message = this.translate.instant("ISSUES.CONFIRM_DETACH_FROM_SPRINT.MESSAGE", {
                sprintName: currentSprint?.name,
            });

            this.confirm.ask(title, null, message).then((askResponse: any) => {
                this.modelTransform
                    .save((issue: any) => {
                        this.setMilestone(issue, null);
                        return issue;
                    })
                    .then(
                        () => {
                            this.rootScope.$broadcast("assign-sprint-to-issue:success", null);
                            askResponse.finish();
                        },
                        () => {
                            askResponse.finish(false);
                            this.confirm.notify("error");
                        },
                    );
            });
        });
    }

    private setMilestone(issue: any, milestoneId: any): void {
        if (typeof issue.setAttr === "function") {
            issue.setAttr("milestone", milestoneId);
        } else {
            issue.milestone = milestoneId;
        }
    }
}
