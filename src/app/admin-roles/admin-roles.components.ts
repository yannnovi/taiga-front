import { Component, ElementRef, EventEmitter, Inject, Input, OnChanges, Output, SimpleChanges } from "@angular/core";
import { AJS_CONFIRM, AJS_REPO, AJS_ROOT_SCOPE } from "../shared/ajs-tokens";

/*
 * Admin > Permissions (roles). The AngularJS directives all read `RolesController`'s scope
 * (`role`, `roles`, `project`, `projectId`) and called it through `$el.controller()`;
 * these take inputs and report back through outputs bound to the controller's existing
 * methods (`ctrl.setRole`, `ctrl.forceLoadProject`). The controller is unchanged. Its
 * `setRole` still broadcasts `role:changed`; the components react to the `role` input
 * changing instead.
 */

/** Permissions that can't be toggled on a public project (always granted). */
const PUBLIC_PERMISSIONS = ["view_epics", "view_milestones", "view_us", "view_tasks", "view_issues", "view_wiki_pages", "view_wiki_links"];

const P = "COMMON.PERMISIONS_CATEGORIES";

const CATEGORIES: Array<{ name: string; permissions: Array<{ key: string; name: string }> }> = [
    {
        name: `${P}.EPICS.NAME`,
        permissions: [
            { key: "view_epics", name: `${P}.EPICS.VIEW_EPICS` },
            { key: "add_epic", name: `${P}.EPICS.ADD_EPICS` },
            { key: "modify_epic", name: `${P}.EPICS.MODIFY_EPICS` },
            { key: "comment_epic", name: `${P}.EPICS.COMMENT_EPICS` },
            { key: "delete_epic", name: `${P}.EPICS.DELETE_EPICS` },
        ],
    },
    {
        name: `${P}.SPRINTS.NAME`,
        permissions: [
            { key: "view_milestones", name: `${P}.SPRINTS.VIEW_SPRINTS` },
            { key: "add_milestone", name: `${P}.SPRINTS.ADD_SPRINTS` },
            { key: "modify_milestone", name: `${P}.SPRINTS.MODIFY_SPRINTS` },
            { key: "delete_milestone", name: `${P}.SPRINTS.DELETE_SPRINTS` },
        ],
    },
    {
        name: `${P}.USER_STORIES.NAME`,
        permissions: [
            { key: "view_us", name: `${P}.USER_STORIES.VIEW_USER_STORIES` },
            { key: "add_us", name: `${P}.USER_STORIES.ADD_USER_STORIES` },
            { key: "modify_us", name: `${P}.USER_STORIES.MODIFY_USER_STORIES` },
            { key: "comment_us", name: `${P}.USER_STORIES.COMMENT_USER_STORIES` },
            { key: "delete_us", name: `${P}.USER_STORIES.DELETE_USER_STORIES` },
        ],
    },
    {
        name: `${P}.TASKS.NAME`,
        permissions: [
            { key: "view_tasks", name: `${P}.TASKS.VIEW_TASKS` },
            { key: "add_task", name: `${P}.TASKS.ADD_TASKS` },
            { key: "modify_task", name: `${P}.TASKS.MODIFY_TASKS` },
            { key: "comment_task", name: `${P}.TASKS.COMMENT_TASKS` },
            { key: "delete_task", name: `${P}.TASKS.DELETE_TASKS` },
        ],
    },
    {
        name: `${P}.ISSUES.NAME`,
        permissions: [
            { key: "view_issues", name: `${P}.ISSUES.VIEW_ISSUES` },
            { key: "add_issue", name: `${P}.ISSUES.ADD_ISSUES` },
            { key: "modify_issue", name: `${P}.ISSUES.MODIFY_ISSUES` },
            { key: "comment_issue", name: `${P}.ISSUES.COMMENT_ISSUES` },
            { key: "delete_issue", name: `${P}.ISSUES.DELETE_ISSUES` },
        ],
    },
    {
        name: `${P}.WIKI.NAME`,
        permissions: [
            { key: "view_wiki_pages", name: `${P}.WIKI.VIEW_WIKI_PAGES` },
            { key: "add_wiki_page", name: `${P}.WIKI.ADD_WIKI_PAGES` },
            { key: "modify_wiki_page", name: `${P}.WIKI.MODIFY_WIKI_PAGES` },
            { key: "delete_wiki_page", name: `${P}.WIKI.DELETE_WIKI_PAGES` },
            { key: "add_wiki_link", name: `${P}.WIKI.ADD_WIKI_LINKS` },
            { key: "delete_wiki_link", name: `${P}.WIKI.DELETE_WIKI_LINKS` },
            { key: "view_wiki_links", name: `${P}.WIKI.VIEW_WIKI_LINKS` },
        ],
    },
];

/** Was `tgEditRole`: inline edition of the selected role's name. */
@Component({
    selector: "tg-edit-role",
    template: `
        <div class="edit-role" [style.display]="editing ? 'block' : 'none'">
            <input type="text" [(ngModel)]="name" (keyup)="onKeyup($event)" />
            <a class="save" href="" [title]="'COMMON.SAVE' | tgTranslate" (click)="submit(); $event.preventDefault()">
                <tg-svg svg-icon="icon-save"></tg-svg>
            </a>
        </div>
        <p class="total" [style.display]="editing ? 'none' : ''">
            <span class="role-name" [title]="'ADMIN.ROLES.COUNT_MEMBERS' | tgTranslate">{{ role?.name }}</span>
            <a class="edit-value" href="" (click)="startEdit(); $event.preventDefault()">
                <tg-svg svg-icon="icon-edit"></tg-svg>
            </a>
        </p>
    `,
})
export class EditRoleComponent implements OnChanges {
    @Input() role: any;

    editing = false;
    name = "";

    constructor(
        private elementRef: ElementRef<HTMLElement>,
        @Inject(AJS_REPO) private repo: any,
        @Inject(AJS_CONFIRM) private confirm: any,
    ) {}

    ngOnChanges(changes: SimpleChanges): void {
        if (changes["role"] && !changes["role"].firstChange) {
            this.editing = false;
        }
    }

    startEdit(): void {
        this.name = this.role.name;
        this.editing = true;
        setTimeout(() => (this.elementRef.nativeElement.querySelector(".edit-role input") as HTMLInputElement | null)?.focus());
    }

    onKeyup(event: KeyboardEvent): void {
        if (event.key === "Enter") {
            this.submit();
        } else if (event.key === "Escape") {
            this.editing = false;
        }
    }

    submit(): void {
        this.role.name = this.name;
        this.editing = false;

        this.repo.save(this.role).then(
            () => this.confirm.notify("success"),
            () => this.confirm.notify("error"),
        );
    }
}

/** Was `tgNewRole`: the "new role" button + input at the bottom of the roles submenu. */
@Component({
    selector: "tg-new-role",
    template: `
        <button
            *ngIf="!showInput"
            class="btn-small btn-menu-full add-button"
            variant="primary"
            [title]="'ADMIN.SUBMENU_ROLES.TITLE_ACTION_NEW_ROLE' | tgTranslate"
            (click)="open($event)"
        >
            {{ "ADMIN.SUBMENU_ROLES.ACTION_NEW_ROLE" | tgTranslate }}
        </button>
        <input *ngIf="showInput" type="text" class="new" [(ngModel)]="name" (keyup)="onKeyup($event)" />
    `,
})
export class NewRoleComponent {
    @Input() roles: any[] = [];
    @Input() projectId: any;

    /** The created role; the jade binds it to `ctrl.setRole($event); ctrl.forceLoadProject()`. */
    @Output() created = new EventEmitter<any>();

    static readonly DEFAULT_PERMISSIONS = ["view_project", "view_milestones", "view_us", "view_tasks", "view_issues"];

    showInput = false;
    name = "";

    constructor(
        private elementRef: ElementRef<HTMLElement>,
        @Inject(AJS_REPO) private repo: any,
        @Inject(AJS_CONFIRM) private confirm: any,
    ) {}

    open(event: Event): void {
        event.preventDefault();
        this.showInput = true;
        setTimeout(() => (this.elementRef.nativeElement.querySelector("input.new") as HTMLInputElement | null)?.focus());
    }

    onKeyup(event: KeyboardEvent): void {
        event.preventDefault();

        if (event.key === "Escape") {
            this.showInput = false;
            this.name = "";
            return;
        }

        if (event.key !== "Enter") {
            return;
        }

        const realRoles = this.roles.filter((r) => !r.external_user);
        const newRole = {
            project: this.projectId,
            name: this.name,
            permissions: NewRoleComponent.DEFAULT_PERMISSIONS,
            order: Math.max(...realRoles.map((r) => r.order)) + 1,
            computable: false,
        };

        this.showInput = false;
        this.name = "";

        this.repo.create("roles", newRole).then(
            (role: any) => {
                // before the trailing "external user" pseudo-role, as before
                this.roles.splice(this.roles.length - 1, 0, role);
                this.created.emit(role);
            },
            () => this.confirm.notify("error"),
        );
    }
}

interface PermissionView {
    key: string;
    name: string;
    active: boolean;
    editable: boolean;
}

interface CategoryView {
    name: string;
    permissions: PermissionView[];
    activePermissions: number;
}

/** Was `tgRolePermissions`: the permission matrix of the selected role (or of external users). */
@Component({
    selector: "tg-role-permissions",
    template: `
        <div class="category-config-list">
            <div class="category-config" *ngFor="let category of categories; let index = index" [attr.data-id]="index">
                <div class="resume" [class.open-drawer]="openCategories.has(index)" (click)="toggleCategory(index, $event)">
                    <div class="resume-title">{{ category.name | tgTranslate }}</div>
                    <div class="summary-role">
                        <div class="count">{{ category.activePermissions }}/{{ category.permissions.length }}</div>
                        <div
                            *ngFor="let permission of category.permissions"
                            class="role-summary-single check-toggle"
                            [class.active]="permission.active"
                            [title]="permission.name | tgTranslate"
                        ></div>
                    </div>
                    <tg-svg svg-icon="icon-arrow-right"></tg-svg>
                </div>
                <div class="category-items" [class.open]="openCategories.has(index)">
                    <div class="items-container">
                        <div class="category-item" *ngFor="let permission of category.permissions" [attr.data-id]="permission.key">
                            <span>{{ permission.name | tgTranslate }}</span>
                            <div class="check">
                                <input
                                    type="checkbox"
                                    [disabled]="!permission.editable"
                                    [checked]="permission.active"
                                    (change)="toggle(permission, $event)"
                                />
                                <div></div>
                                <span class="check-text check-yes">{{ "COMMON.YES" | tgTranslate }}</span>
                                <span class="check-text check-no">{{ "COMMON.NO" | tgTranslate }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
})
export class RolePermissionsComponent implements OnChanges {
    @Input() role: any;
    @Input() project: any;

    /** After a successful save; the jade binds it to `ctrl.forceLoadProject()`. */
    @Output() saved = new EventEmitter<void>();

    categories: CategoryView[] = [];
    openCategories = new Set<number>();

    constructor(
        @Inject(AJS_REPO) private repo: any,
        @Inject(AJS_CONFIRM) private confirm: any,
        @Inject(AJS_ROOT_SCOPE) private rootScope: any,
    ) {}

    ngOnChanges(): void {
        this.render();
    }

    private render(): void {
        if (!this.role || !this.project) {
            this.categories = [];
            return;
        }

        const granted: string[] = this.role.permissions || [];

        this.categories = CATEGORIES.map((category) => {
            const permissions = category.permissions.map((p) => {
                let editable = !(this.role.external_user && !this.project.is_private && p.key.indexOf("view_") === 0);

                if (!this.project.is_private && PUBLIC_PERMISSIONS.includes(p.key)) {
                    editable = false;
                }

                return { ...p, active: granted.includes(p.key), editable };
            });

            return { name: category.name, permissions, activePermissions: permissions.filter((p) => p.active).length };
        });
    }

    toggleCategory(index: number, event: Event): void {
        event.preventDefault();

        if (this.openCategories.has(index)) {
            this.openCategories.delete(index);
        } else {
            this.openCategories.add(index);
        }
    }

    private activePermissions(): string[] {
        const active = this.categories
            .flatMap((c) => c.permissions)
            .filter((p) => p.active)
            .map((p) => p.key)
            .sort();

        if (active.length) {
            active.push("view_project");
        }

        return active;
    }

    toggle(permission: PermissionView, event: Event): void {
        const input = event.target as HTMLInputElement;
        permission.active = input.checked;

        const previous = this.role.permissions;
        this.role.permissions = this.activePermissions();

        const onSuccess = () => {
            this.render();
            this.rootScope.$broadcast("projects:reload");
            this.confirm.notify("success");
            this.saved.emit();
        };

        const onError = () => {
            this.confirm.notify("error");
            permission.active = !permission.active;
            input.checked = permission.active;
            this.role.permissions = previous;
            this.render();
        };

        if (this.role.external_user) {
            this.project.public_permissions = this.role.permissions;
            this.project.anon_permissions = this.role.permissions.filter((p: string) => p.indexOf("view_") === 0);
            this.repo.save(this.project).then(onSuccess, onError);
        } else {
            this.repo.save(this.role).then(onSuccess, onError);
        }
    }
}
