import { Component, EventEmitter, Inject, Input, OnChanges, Output } from "@angular/core";
import { AJS_AVATAR_SERVICE, AJS_DUE_DATE_SERVICE, AJS_PROJECT_SERVICE, AJS_TRANSLATE } from "../shared/ajs-tokens";

declare const taiga: any;
declare const window: any;

/**
 * Angular replacement for the AngularJS `tgCard` directive
 * (app/modules/components/card/), downgraded in place under the same name - the shared
 * kanban/taskboard card, prerequisite for migrating `tgKanbanSortable`/
 * `tgTaskboardSortable` (dragula -> @angular/cdk/drag-drop, see MIGRATION_ROADMAP.md).
 *
 * The original spread across 12 files: `card.jade` + 5 true Jade `include`s
 * (card-tags/card-epics/card-title/card-tasks/card-unfold, sharing the controller's scope
 * at compile time - inlined directly into this component's own template, same idea as
 * `wiki-history-entry` inlining `history-attachments`), and 3 *separate* AngularJS
 * directives (`tgCardAssignedTo`/`tgCardData`/`tgCardActions`, app/coffee/modules/kanban/main.coffee)
 * that built raw HTML strings via `_.template()` (an EJS-flavored ".jade" file, not real
 * Jade) and manually inserted them with `$el.html(html)` - replaced here with plain
 * Angular template bindings, no templating workaround needed. `tg-card-slideshow`
 * (previously a separate AngularJS directive) is migrated alongside as
 * `CardSlideshowComponent` and used natively.
 *
 * `getLinkParams()` (`card-title.jade`'s `tg-nav-get-params`) originally walked UP the
 * AngularJS scope chain (`taiga.findScope`) to reach the parent `KanbanController`'s
 * `lastLoadUserstoriesParams`/`scope.swimlanesList`, to preserve the kanban board's
 * swimlane/filter context when navigating to a US/task detail and back. A real Angular
 * component has no such scope chain to walk, so this becomes an explicit `@Input()
 * linkParams` instead - the kanban caller (still AngularJS) computes it directly (it
 * already has its own `lastLoadUserstoriesParams`, no scope-walking needed there) and
 * passes it down; the taskboard caller doesn't pass it at all, matching its controller
 * never having had an equivalent property (the original scope-walk would have silently
 * fallen through to `{}` there too).
 *
 * `onClickRemove` (declared in the original's `bindToController` but never wired by any
 * of the three sub-directives, never read by the controller, and never passed by any
 * caller) is dead wiring, omitted here rather than replicated. `hasMultipleAssignedUsers`
 * is *also* unused by any template but was a real controller method (unlike
 * `onClickRemove`, which was never even implemented) - kept for fidelity.
 *
 * `card-data.jade`'s `avatars` map (built by the original `CardDataDirective`) is never
 * actually referenced anywhere in that template's own markup - confirmed dead
 * computation, not replicated.
 */
@Component({
    selector: "tg-card",
    templateUrl: "./card.component.html",
})
export class CardComponent implements OnChanges {
    @Input() project: any;
    @Input() item: any;
    @Input() zoom: any;
    @Input() zoomLevel: number;
    @Input() archived: boolean;
    @Input() inViewPort: boolean;
    @Input() folded: boolean;
    @Input() type: string;
    @Input() isFirst: boolean;
    @Input() linkParams: any;

    @Output() toggleFold = new EventEmitter<{ id: any }>();
    @Output() clickAssignedTo = new EventEmitter<{ id: any }>();
    @Output() clickEdit = new EventEmitter<{ id: any }>();
    @Output() clickDelete = new EventEmitter<{ id: any }>();
    @Output() clickMoveToTop = new EventEmitter<{ id: any }>();

    avatarsById: any = {};
    openPopup = false;
    spinnerSrc = `${window._version}/svg/spinner-circle.svg`;
    unassignedImageSrc = `${window._version}/images/unnamed.png`;

    constructor(
        @Inject(AJS_TRANSLATE) private translate: any,
        @Inject(AJS_PROJECT_SERVICE) private projectService: any,
        @Inject(AJS_AVATAR_SERVICE) private avatarService: any,
        @Inject(AJS_DUE_DATE_SERVICE) private dueDateService: any,
    ) {}

    ngOnChanges(): void {
        this.updateAvatars();
    }

    private updateAvatars(): void {
        this.avatarsById = {};

        const users = this.item.get("assigned_users") || [this.item.get("assigned_to")];

        users.forEach((user: any) => {
            if (user) {
                this.avatarsById[user.get("id")] = this.avatarService.getAvatar(user, "avatar");
            }
        });
    }

    visible(name: string): boolean {
        return this.zoom.indexOf(name) !== -1;
    }

    hasTasks(): boolean {
        const tasks = this.item.getIn(["model", "tasks"]);

        return tasks && tasks.size > 0;
    }

    getTagColor(color: string): string {
        return color || "#A9AABC";
    }

    /** Unused by any template in the original either, kept for fidelity. */
    hasMultipleAssignedUsers(): boolean {
        const assignedUsers = this.item.getIn(["model", "assigned_users"]);

        return assignedUsers && assignedUsers.size > 1;
    }

    hasVisibleAttachments(): boolean {
        return this.item.get("images").size > 0;
    }

    getClosedTasks(): any {
        return this.item.getIn(["model", "tasks"]).filter((task: any) => task.get("is_closed"));
    }

    closedTasksPercent(): number {
        return (this.getClosedTasks().size * 100) / this.item.getIn(["model", "tasks"]).size;
    }

    getModifyPermisionKey(): string {
        return this.type === "task" ? "modify_task" : "modify_us";
    }

    getDeletePermisionKey(): string {
        return this.type === "task" ? "delete_task" : "delete_us";
    }

    canEditModify(): boolean {
        return this.projectService.canEdit(this.getModifyPermisionKey());
    }

    canEditDelete(): boolean {
        return this.projectService.canEdit(this.getDeletePermisionKey());
    }

    private setVisibility(): { related: boolean; slides: boolean } {
        const visibility = {
            related: this.visible("related_tasks"),
            slides: this.visible("attachments"),
        };

        if (this.item.get("foldStatusChanged") !== undefined && this.visible("unfold")) {
            // by default attachments & task are folded in level 2, see card-unfold in the template
            if (this.zoomLevel === 2) {
                visibility.related = this.item.get("foldStatusChanged");
                visibility.slides = this.item.get("foldStatusChanged");
            } else {
                visibility.related = !this.item.get("foldStatusChanged");
                visibility.slides = !this.item.get("foldStatusChanged");
            }
        }

        if (!this.item.getIn(["model", "tasks"]) || !this.item.getIn(["model", "tasks"]).size) {
            visibility.related = false;
        }

        if (!this.item.get("images") || !this.item.get("images").size) {
            visibility.slides = false;
        }

        return visibility;
    }

    isRelatedTasksVisible(): boolean {
        return this.setVisibility().related;
    }

    isSlideshowVisible(): boolean {
        return this.setVisibility().slides;
    }

    getNavKey(): string {
        if (this.type === "task") {
            return "project-tasks-detail";
        } else if (this.type === "issue") {
            return "project-issues-detail";
        }

        return "project-userstories-detail";
    }

    get assignedUsersPreview(): any[] | null {
        const preview = this.item.get("assigned_users_preview");

        return preview ? preview.toJS() : null;
    }

    dueDateColor(): string {
        return this.dueDateService.color({
            dueDate: this.item.getIn(["model", "due_date"]),
            isClosed: this.item.getIn(["model", "is_closed"]),
            objType: this.type,
        });
    }

    dueDateTitle(): string {
        return this.dueDateService.title({
            dueDate: this.item.getIn(["model", "due_date"]),
            isClosed: this.item.getIn(["model", "is_closed"]),
            objType: this.type,
        });
    }

    totalAttachments(): number {
        if (this.type === "task") {
            return this.item.getIn(["model", "attachments"]).size;
        }

        return this.item.getIn(["model", "total_attachments"]);
    }

    emptyTask(): boolean {
        const tasks = this.item.getIn(["model", "tasks"]);

        return !tasks || !tasks.size;
    }

    openActionsPopup(event: MouseEvent): void {
        if (this.openPopup) {
            return;
        }

        // `event.currentTarget` is only valid while the event is dispatching - it resets to
        // `null` by the time the popover's close callback runs later, so the button element
        // itself is captured here upfront rather than reading `event.currentTarget` again below.
        const button = event.currentTarget as HTMLElement;

        this.openPopup = true;
        button.classList.add("popover-open");

        const actions = [];

        if (this.canEditModify()) {
            actions.push(
                {
                    text: this.translate.instant("COMMON.CARD.EDIT"),
                    icon: "icon-edit",
                    event: () => this.clickEdit.emit({ id: this.item.get("id") }),
                },
                {
                    text: this.translate.instant("COMMON.CARD.ASSIGN_TO"),
                    icon: "icon-assign-to",
                    event: () => this.clickAssignedTo.emit({ id: this.item.get("id") }),
                },
            );
        }

        if (this.canEditDelete()) {
            actions.push({
                text: this.translate.instant("COMMON.CARD.DELETE"),
                icon: "icon-trash",
                event: () => this.clickDelete.emit({ id: this.item.get("id") }),
            });
        }

        if (this.canEditModify() && !this.isFirst) {
            actions.push({
                text: this.translate.instant("COMMON.CARD.MOVE_TO_TOP"),
                icon: "icon-move-to-top",
                event: () => this.clickMoveToTop.emit({ id: this.item.get("id") }),
            });
        }

        taiga.globalPopover(button, actions, {}, () => {
            this.openPopup = false;
            button.classList.remove("popover-open");
        });
    }
}
