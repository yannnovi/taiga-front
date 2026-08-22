import { Component, ElementRef, Inject, Input, OnDestroy } from "@angular/core";
import {
    AJS_ATTACHMENTS_SERVICE,
    AJS_CONFIRM,
    AJS_LIGHTBOX_SERVICE,
    AJS_MODEL,
    AJS_REPO,
    AJS_ROOT_SCOPE,
    AJS_TG_RESOURCES,
    AJS_TRANSLATE,
} from "../shared/ajs-tokens";

declare const $: any;
declare const _: any;
declare const taiga: any;
declare const Immutable: any;
declare const moment: any;

interface Schema {
    objName: string;
    model: string;
    params: any;
    data: (project: any) => any;
    initialData: (data: any) => any;
}

/**
 * Angular replacement for the AngularJS `tgLbCreateEdit` directive
 * (app/coffee/modules/common/lightboxes.coffee, `CreateEditDirective`), downgraded in place
 * under the same name - the generic create/edit/add-existing lightbox shared by
 * userstories, tasks, and issues. Placed identically (bare, ambient, broadcast-driven, no
 * `@Input()`s) in `backlog.jade`/`taskboard.jade`/`issues.jade`/`kanban.jade`.
 *
 * The original re-`$compile`d its entire template from scratch on every open
 * (`$template.get(...)`/`$compile(...)($scope.$new())`) because it was itself
 * AngularJS - this component's template is static and reactive instead (`*ngIf`s driven by
 * `mode`/`objType`), no re-compilation needed.
 *
 * `tg-search-list` (the "add existing issue" picker) is NOT ported as a separate reusable
 * component here: it's also used by `assign-sprint-to-issue-button.jade` (a still-AngularJS
 * caller, out of scope) with a different `itemType` ("sprint") that this migration doesn't
 * touch, so the original AngularJS `tgSearchList` directive stays registered and active for
 * that caller. This component only needs the "existing issue" case, so that specific
 * filtered-list behavior is inlined directly here instead of rebuilding `tg-search-list`'s
 * full generic-reusability machinery for a single caller.
 *
 * The `.swimlane-select` block in the original's US fields (`bind-swimlanes="swimlanesList"`)
 * is not reproduced: `swimlanesList`/`noSwimlaneUserStories` were never actually set
 * anywhere on this directive's own scope in the original (not part of `schemas.us.data()`,
 * not bound as an attribute by any of the 4 callers) - the block was already dead in
 * production, not something this port newly breaks.
 */
@Component({
    selector: "tg-lb-create-edit",
    templateUrl: "./lightbox-create-edit.component.html",
})
export class LightboxCreateEditComponent implements OnDestroy {
    @Input() usersById: Record<string, any> = {};
    // `genericform:edit` (unlike `:new`/`:new-or-existing`) never sends `project` in its
    // broadcast payload - the original relied on it already being on the shared ambient
    // scope (`BacklogController`/etc.'s own `project`). Bound the same way as `usersById` so
    // edit mode still has it; `getSchema` below still overwrites it whenever a broadcast
    // *does* provide one (new/new-or-existing), same object either way.
    @Input() project: any;

    lightboxOpen = false;
    mode: "new" | "edit" | "add-existing" = "new";
    getOrCreate = false;
    objType: "us" | "task" | "issue";
    objName = "";
    translationID = "";
    translationIDPlural = "";
    targetName = "";

    obj: any;
    attachments: any = Immutable.List();
    statusList: any[] = [];
    selectedStatus: any;

    typeById: Record<string, any> = {};
    typeList: any[] = [];
    severityById: Record<string, any> = {};
    severityList: any[] = [];
    priorityById: Record<string, any> = {};
    priorityList: any[] = [];
    milestonesById: Record<string, any> = {};

    existingItems: any = Immutable.List();
    existingFilterText = "";
    selectedExistingItem: any = null;

    submitting = false;
    displayStatusSelector = false;

    private sprintId: any;
    private usId: any;
    private relatedField: any;
    private relatedObjectId: any;

    private schema: Schema;
    private attachmentsToAdd: any = Immutable.List();
    private attachmentsToDelete: any = Immutable.List();

    private readonly schemas: Record<string, Schema> = {
        us: {
            objName: "User Story",
            model: "userstories",
            params: { include_attachments: true, include_tasks: true },
            data: (project: any) => ({
                translationID: "US",
                translationIDPlural: "US",
                statusList: _.sortBy(project.us_statuses, "order"),
            }),
            initialData: (data: any) => ({
                project: data.project.id,
                subject: "",
                description: "",
                tags: [],
                points: {},
                swimlane: data.project.is_kanban_activated ? data.project.default_swimlane : null,
                status: data.statusId ? data.statusId : data.project.default_us_status,
                is_archived: false,
            }),
        },
        task: {
            objName: "Task",
            model: "tasks",
            params: { include_attachments: true },
            data: (project: any) => ({
                translationID: "TASK",
                translationIDPlural: "TASKS",
                statusList: _.sortBy(project.task_statuses, "order"),
            }),
            initialData: (data: any) => ({
                project: data.project.id,
                subject: "",
                description: "",
                assigned_to: null,
                tags: [],
                milestone: data.sprintId,
                status: data.project.default_task_status,
                user_story: data.usId,
                is_archived: false,
            }),
        },
        issue: {
            objName: "Issue",
            model: "issues",
            params: { include_attachments: true },
            data: (project: any) => ({
                translationID: "ISSUE",
                translationIDPlural: "ISSUES",
                statusList: _.sortBy(project.issue_statuses, "order"),
                typeById: taiga.groupBy(project.issue_types, (x: any) => x.id),
                typeList: _.sortBy(project.issue_types, "order"),
                severityById: taiga.groupBy(project.severities, (x: any) => x.id),
                severityList: _.sortBy(project.severities, "order"),
                priorityById: taiga.groupBy(project.priorities, (x: any) => x.id),
                priorityList: _.sortBy(project.priorities, "order"),
                milestonesById: taiga.groupBy(project.milestones, (x: any) => x.id),
            }),
            initialData: (data: any) => ({
                assigned_to: null,
                milestone: data.sprintId,
                priority: data.project.default_priority,
                project: data.project.id,
                severity: data.project.default_severity,
                status: data.project.default_issue_status,
                subject: "",
                tags: [],
                type: data.project.default_issue_type,
            }),
        },
    };

    private unwatchNew: () => void;
    private unwatchNewOrExisting: () => void;
    private unwatchEdit: () => void;
    private keydownHandler = (event: KeyboardEvent) => {
        if (this.lightboxOpen && event.keyCode === 27) {
            this.checkClose();
        }
    };

    constructor(
        private elementRef: ElementRef,
        @Inject(AJS_LIGHTBOX_SERVICE) private lightboxService: any,
        @Inject(AJS_REPO) private repo: any,
        @Inject(AJS_MODEL) private model: any,
        @Inject(AJS_TG_RESOURCES) private rs: any,
        @Inject(AJS_ROOT_SCOPE) private rootScope: any,
        @Inject(AJS_TRANSLATE) private translate: any,
        @Inject(AJS_CONFIRM) private confirm: any,
        @Inject(AJS_ATTACHMENTS_SERVICE) private attachmentsService: any,
    ) {
        this.unwatchNew = this.rootScope.$on("genericform:new", (event: any, params: any) => {
            if (!this.getSchema(params)) {
                return;
            }

            this.mode = "new";
            this.getOrCreate = false;
            this.mount(params);
        });

        this.unwatchNewOrExisting = this.rootScope.$on(
            "genericform:new-or-existing",
            (event: any, params: any) => {
                if (!this.getSchema(params)) {
                    return;
                }

                this.mode = "add-existing";
                this.getOrCreate = true;
                this.existingFilterText = "";
                this.selectedExistingItem = null;

                this.rs[this.schema.model].listInAllProjects({ project: this.project.id }, true).then((data: any) => {
                    // The original did `angular.copy(data)` here before handing it to
                    // `tg-search-list`, which (like this replacement) reads plain
                    // properties (`item.ref`/`item[relatedField]`), not `.get(...)` -
                    // `data` itself is a list of Immutable Records, `.toJS()` is this
                    // migration's equivalent plain-object conversion.
                    this.existingItems = data.toJS ? data.toJS() : data;
                });

                this.mount(params);
            },
        );

        this.unwatchEdit = this.rootScope.$on("genericform:edit", (event: any, params: any) => {
            if (!this.getSchema(params)) {
                return;
            }

            this.mode = "edit";
            this.getOrCreate = false;
            this.mount(params);
        });

        document.addEventListener("keydown", this.keydownHandler);
    }

    ngOnDestroy(): void {
        this.unwatchNew();
        this.unwatchNewOrExisting();
        this.unwatchEdit();
        document.removeEventListener("keydown", this.keydownHandler);
    }

    setMode(value: "new" | "edit" | "add-existing"): void {
        this.mode = value;
    }

    get existingItemsFiltered(): any[] {
        const items = this.existingItems.toArray ? this.existingItems.toArray() : this.existingItems;
        const text = this.existingFilterText.trim().toLowerCase();

        if (!text) {
            return items;
        }

        return items.filter((item: any) => {
            const ref = `${this.itemProp(item, "ref")}`.toLowerCase();
            const subject = `${this.itemProp(item, "subject")}`.toLowerCase();

            return ref.indexOf(text) > -1 || subject.indexOf(text) > -1;
        });
    }

    isDisabledExisting(item: any): boolean {
        return !!item && this.itemProp(item, this.relatedField) === this.relatedObjectId;
    }

    itemProp(item: any, key: string): any {
        return typeof item.get === "function" ? item.get(key) : item[key];
    }

    selectExistingItem(item: any): void {
        if (this.isDisabledExisting(item)) {
            return;
        }

        this.selectedExistingItem = item;
    }

    addExistingToSprint(): void {
        const item = this.selectedExistingItem;

        if (!item || this.isDisabledExisting(item)) {
            return;
        }

        if (this.itemProp(item, "milestone")) {
            this.sprintChangeConfirmAndSave(item);
        } else {
            this.saveItem(
                item,
                () => {
                    this.close();
                    this.rootScope.$broadcast(`${this.objType}form:add:success`, item);
                },
                () => {
                    this.close();
                },
            );
        }
    }

    private sprintChangeConfirmAndSave(item: any): void {
        const oldSprintName = this.milestonesById[this.itemProp(item, "milestone")].name;
        const newSprintName = this.milestonesById[this.relatedObjectId].name;
        const title = this.translate.instant("ISSUES.CONFIRM_CHANGE_FROM_SPRINT.TITLE");
        const message = this.translate.instant("ISSUES.CONFIRM_CHANGE_FROM_SPRINT.MESSAGE", {
            issue: this.itemProp(item, "subject"),
            oldSprintName,
            newSprintName,
        });

        this.confirm.ask(title, null, message).then((askResponse: any) => {
            this.saveItem(
                item,
                () => {
                    askResponse.finish();
                    this.lightboxService.closeAll();
                    this.lightboxOpen = false;
                    this.rootScope.$broadcast(`${this.objType}form:add:success`, item);
                },
                () => {
                    askResponse.finish(false);
                    this.confirm.notify("error");
                },
            );
        });
    }

    private saveItem(item: any, onSuccess: () => void, onError: () => void): void {
        if (typeof item.setAttr === "function") {
            item.setAttr(this.relatedField, this.relatedObjectId);
        } else {
            item[this.relatedField] = this.relatedObjectId;
        }

        this.repo.save(item, true).then(onSuccess, onError);
    }

    addAttachment(attachment: any): void {
        this.attachmentsToAdd = this.attachmentsToAdd.push(attachment);
    }

    deleteAttachment(attachment: any): void {
        this.attachmentsToAdd = this.attachmentsToAdd.filter((it: any) => it.get("name") !== attachment.get("name"));

        if (attachment.get("id")) {
            this.attachmentsToDelete = this.attachmentsToDelete.push(attachment);
        }
    }

    addTag(event: { name: string; color: string | null }): void {
        const value = `${event.name}`.trim().toLowerCase();
        let tags = this.project.tags;
        let projectTags = this.project.tags_colors;

        if (!tags) {
            tags = [];
        }

        if (!projectTags) {
            projectTags = {};
        }

        if (tags.indexOf(value) === -1) {
            tags.push(value);
        }

        projectTags[event.name] = event.color || null;
        this.project.tags = tags;

        const itemTags = _.clone(this.obj.tags);
        const inserted = _.find(itemTags, (it: any) => it[0] === value);

        if (!inserted) {
            itemTags.push([value, event.color]);
            this.obj.tags = itemTags;
        }
    }

    deleteTag(event: { tag: [string, string | null] }): void {
        const value = `${event.tag[0]}`.trim().toLowerCase();
        const itemTags = _.clone(this.obj.tags);

        _.remove(itemTags, (tag: any) => tag[0] === value);
        this.obj.tags = itemTags;
    }

    isTeamRequirement(): boolean {
        return !!this.obj?.team_requirement;
    }

    isClientRequirement(): boolean {
        return !!this.obj?.client_requirement;
    }

    toggleTeamRequirement(): void {
        this.obj.team_requirement = !this.obj.team_requirement;
    }

    toggleClientRequirement(): void {
        this.obj.client_requirement = !this.obj.client_requirement;
    }

    toggleIsBlocked(): void {
        this.obj.is_blocked = !this.obj.is_blocked;
    }

    toggleIocaine(): void {
        this.obj.is_iocaine = !this.obj.is_iocaine;
    }

    toggleStatusSelector(): void {
        this.displayStatusSelector = !this.displayStatusSelector;
    }

    selectStatus(id: any): void {
        this.setStatus(id);
        this.displayStatusSelector = false;
    }

    close(): void {
        this.lightboxService.closeAll();
        this.lightboxOpen = false;
    }

    checkClose(): void {
        if (!this.obj.isModified()) {
            this.close();
            this.obj.revert();
        } else {
            this.confirm.ask(this.translate.instant("LIGHTBOX.CREATE_EDIT.CONFIRM_CLOSE")).then((result: any) => {
                result.finish();
                this.close();
            });
        }
    }

    submit(): void {
        if (this.submitting) {
            return;
        }

        this.submitting = true;

        let usPosition: any = null;
        let promise;
        let broadcastEvent: string;

        if (this.mode === "new") {
            usPosition = this.obj.us_position;
            delete this.obj.us_position;

            promise = this.repo.create(this.schema.model, this.obj);
            broadcastEvent = `${this.objType}form:new:success`;
        } else {
            if (this.obj.due_date instanceof moment) {
                const prettyDate = this.translate.instant("COMMON.PICKERDATE.FORMAT");

                this.obj.due_date = this.obj.due_date.format(prettyDate);
            }

            promise = this.repo.save(this.obj, true);
            broadcastEvent = `${this.objType}form:edit:success`;
        }

        promise.then(
            (data: any) => {
                this.deleteAttachments().then(() => {
                    this.createAttachments(data).then(() => {
                        this.submitting = false;
                        this.confirm.notify("success");
                        this.close();

                        if (data.ref) {
                            this.rs[this.schema.model].getByRef(data.project, data.ref, this.schema.params).then((obj: any) => {
                                this.rootScope.$broadcast(broadcastEvent, obj, usPosition);
                            });
                        }
                    });
                });
            },
            (response: any) => {
                this.submitting = false;

                if (response.status) {
                    this.confirm.notify("error", this.translate.instant("LIGHTBOX.CREATE_EDIT.ERROR_STATUS"));
                }

                if (response.swimlane) {
                    this.confirm.notify("error", this.translate.instant("LIGHTBOX.CREATE_EDIT.ERROR_SWIMLANE"));
                }

                if (response._error_message) {
                    this.confirm.notify("error", response._error_message);
                }
            },
        );
    }

    private createAttachments(obj: any): Promise<any> {
        const promises = this.attachmentsToAdd
            .toJS()
            .map((attachment: any) => this.attachmentsService.upload(attachment.file, obj.id, this.obj.project, this.objType));

        return Promise.all(promises);
    }

    private deleteAttachments(): Promise<any> {
        const promises = this.attachmentsToDelete
            .toJS()
            .map((attachment: any) => this.attachmentsService.delete(this.objType, attachment.id));

        return Promise.all(promises);
    }

    private getSchema(params: any): boolean {
        Object.keys(params).forEach((key) => {
            (this as any)[key] = params[key];
        });

        if (!this.objType || !this.schemas[this.objType]) {
            // eslint-disable-next-line no-console
            console.error(`Invalid objType \`${this.objType}\` for \`genericform\` event`);
            return false;
        }

        this.schema = this.schemas[this.objType];

        return true;
    }

    private mount(params: any): void {
        this.objName = this.schema.objName;

        if (this.mode === "edit") {
            this.obj = params.obj;
            this.attachments = Immutable.fromJS(params.attachments);
        } else {
            this.obj = this.model.make_model(this.schema.model, this.schema.initialData(params));
            this.attachments = Immutable.List();
        }

        Object.assign(this, this.schema.data(this.project));

        if (params.objType === "us") {
            this.obj.us_position = "bottom";
        }

        this.attachmentsToAdd = Immutable.List();
        this.attachmentsToDelete = Immutable.List();
        this.setStatus(this.obj.status);
        this.lightboxOpen = true;
        this.lightboxService.open($(this.elementRef.nativeElement), null, null, true);
    }

    private setStatus(id: any): void {
        this.obj.status = id;
        this.selectedStatus = _.find(this.statusList, (item: any) => item.id === id);
        this.obj.is_closed = this.selectedStatus?.is_closed;
    }
}
