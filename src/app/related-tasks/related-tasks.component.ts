import { Component, ElementRef, Inject, Input, OnChanges } from "@angular/core";
import { CdkDragDrop } from "@angular/cdk/drag-drop";
import {
    AJS_ANALYTICS,
    AJS_AVATAR_SERVICE,
    AJS_CONFIRM,
    AJS_DUE_DATE_SERVICE,
    AJS_LIGHTBOX_FACTORY,
    AJS_REPO,
    AJS_ROOT_SCOPE,
    AJS_TRANSLATE,
} from "../shared/ajs-tokens";

declare const $: any;

interface NewTask {
    subject: string;
    status: any;
    assigned_to: any;
}

/**
 * Angular replacement for the user story detail's "related tasks" block
 * (`app/partials/includes/modules/related-tasks.jade`), downgraded as
 * `tg-related-tasks-section`. Absorbs the whole AngularJS family that only ever worked on
 * the ambient `UserStoryDetailController` scope (`$scope.project`, `$scope.us`,
 * `$scope.tasks`, `$scope.usersById`, `$scope.activeUsers`, `$scope.taskStatusById`):
 * - `tgRelatedTasks` (section visibility, event relay),
 * - `tgRelatedTaskRow` (lodash-templated view/edit row, `$compile`d by hand),
 * - `tgRelatedTaskCreateForm` / `tgRelatedTaskCreateButton`,
 * - `tgRelatedTaskStatus` (status badge + jQuery popover, `common/popovers.coffee`),
 * - `tgRelatedTaskAssignedToInlineEdition` (avatar + `tg-lb-select-user` lightbox),
 * - `tgTasksSortable` (dragula reordering) -> `@angular/cdk/drag-drop`.
 *
 * The controller is untouched: like the originals, this component talks to it through
 * `$rootScope` broadcasts - `related-tasks:update` after any save/create/delete (the
 * controller reloads `tasks`) and `task:reorder` (task, newIndex) for a drop
 * (`UserStoryDetailController.reorderTask`, which broadcasts `related-tasks:reordered`).
 *
 * Kept as in the original: the 2s leading debounce on subject save and status change
 * (as an in-flight guard here), status changes allowed by permission only (not by
 * archived state), Enter in the create form keeps it open for the next task while the
 * save icon closes it, Escape closes it / cancels the row edit.
 */
@Component({
    selector: "tg-related-tasks-section",
    templateUrl: "./related-tasks.component.html",
})
export class RelatedTasksComponent implements OnChanges {
    @Input() project: any;
    @Input() us: any;
    @Input() tasks: any[] = [];
    @Input() usersById: any = {};
    @Input() activeUsers: any[] = [];

    editingTaskId: number | null = null;
    editSubject = "";
    savingTaskIds = new Set<number>();
    statusSavingTaskIds = new Set<number>();

    showCreateForm = false;
    creating = false;
    newTask: NewTask = { subject: "", status: null, assigned_to: null };

    readonly spinnerSrc = `${(window as any)._version}/svg/spinner-circle.svg`;

    constructor(
        private elementRef: ElementRef<HTMLElement>,
        @Inject(AJS_REPO) private repo: any,
        @Inject(AJS_CONFIRM) private confirm: any,
        @Inject(AJS_ROOT_SCOPE) private rootScope: any,
        @Inject(AJS_TRANSLATE) private translate: any,
        @Inject(AJS_AVATAR_SERVICE) private avatarService: any,
        @Inject(AJS_LIGHTBOX_FACTORY) private lightboxFactory: any,
        @Inject(AJS_DUE_DATE_SERVICE) private dueDateService: any,
        @Inject(AJS_ANALYTICS) private analytics: any,
    ) {}

    ngOnChanges(): void {
        if (this.project && this.newTask.status === null) {
            this.newTask.status = this.project.default_task_status;
        }
    }

    // Permissions

    private hasPerm(perm: string): boolean {
        return !!this.project && this.project.my_permissions.indexOf(perm) !== -1;
    }

    get visible(): boolean {
        return this.hasPerm("view_tasks");
    }

    get canAdd(): boolean {
        return !!this.project && !this.project.archived_code && this.hasPerm("add_task");
    }

    get canModify(): boolean {
        return !!this.project && !this.project.archived_code && this.hasPerm("modify_task");
    }

    get canDelete(): boolean {
        return !!this.project && !this.project.archived_code && this.hasPerm("delete_task");
    }

    /** tgRelatedTaskStatus only checked the permission, not the archived state. */
    get canChangeStatus(): boolean {
        return this.hasPerm("modify_task");
    }

    get sortingDisabled(): boolean {
        return !this.canModify;
    }

    trackById(_index: number, task: any): any {
        return task.id;
    }

    // Status

    statusOf(task: { status: any }): any {
        return (this.project?.task_statuses || []).find((s: any) => s.id === task.status);
    }

    openStatusPopover(event: MouseEvent): void {
        event.preventDefault();
        event.stopPropagation();

        if (!this.canChangeStatus) {
            return;
        }

        $((event.currentTarget as HTMLElement).closest(".status")).find(".pop-status").popover().open();
    }

    selectStatus(task: any, statusId: any, event: MouseEvent, autoSave: boolean): void {
        event.preventDefault();
        event.stopPropagation();

        $((event.currentTarget as HTMLElement).closest(".status")).find(".pop-status").popover().close();

        if (!autoSave) {
            task.status = statusId;
            return;
        }

        if (this.statusSavingTaskIds.has(task.id)) {
            return;
        }

        task.status = statusId;
        this.statusSavingTaskIds.add(task.id);

        this.repo.save(task).then(
            () => {
                this.statusSavingTaskIds.delete(task.id);
                this.rootScope.$broadcast("related-tasks:update");
            },
            () => this.statusSavingTaskIds.delete(task.id),
        );
    }

    // Assigned to

    assignedMember(task: { assigned_to: any }): any {
        return task.assigned_to ? this.usersById?.[task.assigned_to] : null;
    }

    assignedName(task: { assigned_to: any }): string {
        const member = this.assignedMember(task);

        return member ? member.full_name_display : this.translate.instant("COMMON.ASSIGNED_TO.NOT_ASSIGNED");
    }

    avatar(task: { assigned_to: any }): { url: string; bg: string } {
        return this.avatarService.getAvatar(this.assignedMember(task));
    }

    openAssignedTo(task: any, event: MouseEvent, autoSave: boolean): void {
        event.preventDefault();
        event.stopPropagation();

        if (!this.canModify) {
            return;
        }

        const onClose = (assignedUsers: any[]) => {
            task.assigned_to = assignedUsers.pop() || null;

            if (autoSave) {
                this.repo.save(task).then(() => this.rootScope.$broadcast("related-tasks:update"));
            }
        };

        this.lightboxFactory.create(
            "tg-lb-select-user",
            { class: "lightbox lightbox-select-user" },
            {
                currentUsers: [task.assigned_to],
                activeUsers: this.activeUsers,
                onClose,
                single: true,
                lbTitle: this.translate.instant("COMMON.ASSIGNED_USERS.ADD"),
            },
        );
    }

    // Due date

    dueDateColor(task: any): string {
        return this.dueDateService.color({ dueDate: task.due_date, isClosed: task.is_closed, objType: "task" });
    }

    dueDateTitle(task: any): string {
        const date = this.dueDateService.title({ dueDate: task.due_date, isClosed: task.is_closed, objType: "task" });

        return this.translate.instant("COMMON.CARD.DUE_DATE", { date });
    }

    // Row edition (was tgRelatedTaskRow)

    startEdit(task: any, event: Event): void {
        event.preventDefault();
        this.editingTaskId = task.id;
        this.editSubject = task.subject;
        this.focusLater(".single-related-task.editing .task-name input", true);
    }

    cancelEdit(event?: Event): void {
        event?.preventDefault();
        this.editingTaskId = null;
    }

    onEditKeyup(task: any, event: KeyboardEvent): void {
        if (event.key === "Enter") {
            this.saveEdit(task);
        } else if (event.key === "Escape") {
            this.cancelEdit();
        }
    }

    saveEdit(task: any, event?: Event): void {
        event?.preventDefault();

        if (this.savingTaskIds.has(task.id)) {
            return;
        }

        const previousSubject = task.subject;
        task.subject = this.editSubject;
        this.savingTaskIds.add(task.id);

        this.repo.save(task).then(
            () => {
                this.savingTaskIds.delete(task.id);
                this.editingTaskId = null;
                this.rootScope.$broadcast("related-tasks:update");
            },
            () => {
                this.savingTaskIds.delete(task.id);
                task.subject = previousSubject;
                this.editSubject = previousSubject;
                this.confirm.notify("error");
            },
        );
    }

    deleteTask(task: any, event: Event): void {
        event.preventDefault();

        const title = this.translate.instant("TASK.TITLE_DELETE_ACTION");

        this.confirm.askOnDelete(title, task.subject).then((askResponse: any) => {
            this.repo.remove(task).then(
                () => {
                    askResponse.finish();
                    this.rootScope.$broadcast("related-tasks:update");
                },
                () => {
                    askResponse.finish(false);
                    this.confirm.notify("error");
                },
            );
        });
    }

    // Creation (was tgRelatedTaskCreateForm / tgRelatedTaskCreateButton)

    openCreateForm(): void {
        if (!this.showCreateForm) {
            this.resetNewTask();
            this.showCreateForm = true;
        }

        this.focusLater(".related-task-create-form .task-name input");
    }

    closeCreateForm(): void {
        this.showCreateForm = false;
    }

    onCreateKeyup(event: KeyboardEvent): void {
        if (event.key === "Escape") {
            this.closeCreateForm();
        }
    }

    /** Enter (form submit): create and keep the form open for the next task. */
    submitCreate(event: Event): void {
        event.preventDefault();
        this.createTask().then((ok) => {
            if (ok) {
                this.resetNewTask();
                this.focusLater(".related-task-create-form .task-name input");
            }
        });
    }

    /** Save icon: create and close the form. */
    saveCreate(event: Event): void {
        event.preventDefault();
        this.createTask().then((ok) => {
            if (ok) {
                this.closeCreateForm();
            }
        });
    }

    private createTask(): Promise<boolean> {
        if (this.creating) {
            return Promise.resolve(false);
        }

        const data = {
            subject: this.newTask.subject,
            status: this.newTask.status,
            assigned_to: this.newTask.assigned_to,
            project: this.project.id,
            user_story: this.us.id,
        };

        this.creating = true;

        return new Promise((resolve) => {
            this.repo.create("tasks", data).then(
                () => {
                    this.creating = false;
                    this.analytics.trackEvent("task", "create", "create task on userstory", 1);
                    this.rootScope.$broadcast("related-tasks:update");
                    resolve(true);
                },
                () => {
                    this.creating = false;
                    this.confirm.notify("error");
                    resolve(false);
                },
            );
        });
    }

    private resetNewTask(): void {
        this.newTask = { subject: "", status: this.project?.default_task_status ?? null, assigned_to: null };
    }

    // Reordering (was tgTasksSortable)

    drop(event: CdkDragDrop<any[]>): void {
        if (event.previousIndex === event.currentIndex) {
            return;
        }

        this.rootScope.$broadcast("task:reorder", event.item.data, event.currentIndex);
    }

    private focusLater(selector: string, select = false): void {
        setTimeout(() => {
            const input = this.elementRef.nativeElement.querySelector(selector) as HTMLInputElement | null;

            input?.focus();

            if (select) {
                input?.select();
            }
        });
    }
}
