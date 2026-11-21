import { Component, ElementRef, Inject, Input, OnDestroy, OnInit } from "@angular/core";
import {
    AJS_AVATAR_SERVICE,
    AJS_CONFIRM,
    AJS_LIGHTBOX_SERVICE,
    AJS_NAV_URLS,
    AJS_QUEUE_MODEL_TRANSFORMATION,
    AJS_REPO,
    AJS_ROOT_SCOPE,
    AJS_TG_LOCATION,
    AJS_TRANSLATE,
} from "../shared/ajs-tokens";

declare const $: any;
declare const moment: any;

/*
 * Angular replacements for the small sidebar widgets of the four detail pages (epic, user
 * story, task, issue). Every original directive read the ambient detail controller scope
 * (`$scope.project`, `$scope.statusById`/`statusList`, the item through `ng-model`) and
 * rebuilt its markup from lodash templates; these take explicit inputs instead.
 *
 * All saves go through `$tgQueueModelTransformation` exactly like the originals: the
 * detail controllers register their item with `modelTransform.setObject(scope, '<type>')`,
 * and `save(fn)` queues the change, saves the model and swaps the scope's object. Then the
 * same `$rootScope` broadcast (`object:updated`) the controllers already listen to.
 */

const SPINNER = () => `${(window as any)._version}/svg/spinner-circle.svg`;

function hasPerm(project: any, perm: string): boolean {
    return !!project && project.my_permissions.indexOf(perm) !== -1;
}

function canEditWith(project: any, perm: string): boolean {
    return !!project && !project.archived_code && hasPerm(project, perm);
}

/** Was tgEpicStatusDisplay / tgUsStatusDisplay / tgTaskStatusDisplay / tgIssueStatusDisplay. */
@Component({
    selector: "tg-detail-status-display",
    template: `<span *ngIf="status">{{ (status.is_closed ? "COMMON.STATUS.CLOSED" : "COMMON.STATUS.OPEN") | tgTranslate }}</span>`,
})
export class DetailStatusDisplayComponent {
    @Input() item: any;
    @Input() statusList: any[] = [];

    get status(): any {
        return this.item ? (this.statusList || []).find((s) => s.id === this.item.status) : null;
    }
}

/** Was tgEpicStatusButton / tgUsStatusButton / tgTaskStatusButton / tgIssueStatusButton. */
@Component({
    selector: "tg-detail-status-button",
    template: `
        <ng-container *ngIf="status">
            <span class="detail-status-inner js-edit-status" [class.clickable]="editable" (click)="open($event)">
                <img *ngIf="loading" class="loading-spinner" [src]="spinnerSrc" alt="loading..." />
                <span *ngIf="!loading" [style.background-color]="status.color">
                    <span class="e2e-status">{{ status.name }}</span>
                    <tg-svg *ngIf="editable" svg-icon="icon-arrow-down"></tg-svg>
                </span>
            </span>
            <ul class="pop-status popover">
                <li *ngFor="let st of statusList">
                    <a class="status" href="" [title]="st.name" (click)="select(st.id, $event)">
                        <span class="item-text">{{ st.name }}</span>
                    </a>
                </li>
            </ul>
        </ng-container>
    `,
})
export class DetailStatusButtonComponent {
    @Input() item: any;
    @Input() statusList: any[] = [];
    @Input() project: any;
    /** modify_epic / modify_us / modify_task / modify_issue */
    @Input() permission: string;

    loading = false;
    readonly spinnerSrc = SPINNER();

    constructor(
        private elementRef: ElementRef<HTMLElement>,
        @Inject(AJS_QUEUE_MODEL_TRANSFORMATION) private modelTransform: any,
        @Inject(AJS_ROOT_SCOPE) private rootScope: any,
        @Inject(AJS_CONFIRM) private confirm: any,
    ) {}

    get status(): any {
        return this.item ? (this.statusList || []).find((s) => s.id === this.item.status) : null;
    }

    get editable(): boolean {
        return canEditWith(this.project, this.permission);
    }

    private popover(): any {
        return $(this.elementRef.nativeElement).find(".pop-status").popover();
    }

    open(event: MouseEvent): void {
        event.preventDefault();
        event.stopPropagation();

        if (this.editable) {
            this.popover().open();
        }
    }

    select(statusId: any, event: MouseEvent): void {
        event.preventDefault();
        event.stopPropagation();

        if (!this.editable) {
            return;
        }

        this.popover().close();
        this.loading = true;

        this.modelTransform
            .save((item: any) => {
                item.status = statusId;
                return item;
            })
            .then(
                () => {
                    this.loading = false;
                    this.rootScope.$broadcast("object:updated");
                },
                () => {
                    this.loading = false;
                    this.confirm.notify("error");
                },
            );
    }
}

/**
 * Was tgUsTeamRequirementButton / tgUsClientRequirementButton (used on the US and epic
 * pages). Like the originals, editability checks `modify_us` on both pages.
 */
@Component({
    selector: "tg-detail-requirement-button",
    template: `
        <img *ngIf="loading" class="loading-spinner" [src]="spinnerSrc" alt="loading..." />
        <button
            *ngIf="item && !loading"
            type="button"
            class="btn-icon"
            [class.team-requirement]="kind === 'team'"
            [class.client-requirement]="kind === 'client'"
            [class.is-editable]="editable"
            [class.active]="item[field]"
            [title]="(kind === 'team' ? 'COMMON.TEAM_REQUIREMENT' : 'COMMON.CLIENT_REQUIREMENT') | tgTranslate"
            (click)="toggle()"
        >
            <tg-svg *ngIf="kind === 'team'" svg-icon="icon-team-requirement"></tg-svg>
            <tg-svg *ngIf="kind === 'client'" svg-icon="icon-client-requirement"></tg-svg>
        </button>
    `,
})
export class DetailRequirementButtonComponent {
    @Input() item: any;
    @Input() project: any;
    /** "team" | "client" */
    @Input() kind: string;

    loading = false;
    readonly spinnerSrc = SPINNER();

    constructor(
        @Inject(AJS_QUEUE_MODEL_TRANSFORMATION) private modelTransform: any,
        @Inject(AJS_ROOT_SCOPE) private rootScope: any,
        @Inject(AJS_CONFIRM) private confirm: any,
    ) {}

    get field(): string {
        return this.kind === "client" ? "client_requirement" : "team_requirement";
    }

    get editable(): boolean {
        return canEditWith(this.project, "modify_us");
    }

    toggle(): void {
        if (!this.editable) {
            return;
        }

        const value = !this.item[this.field];
        this.loading = true;

        this.modelTransform
            .save((item: any) => {
                item[this.field] = value;
                return item;
            })
            .then(
                () => {
                    this.loading = false;
                    this.rootScope.$broadcast("object:updated");
                },
                () => {
                    this.loading = false;
                    this.confirm.notify("error");
                },
            );
    }
}

/** Was tgTaskIsIocaineButton: hidden when not editable and the task isn't iocaine. */
@Component({
    selector: "tg-detail-iocaine-button",
    template: `
        <fieldset *ngIf="item && (editable || item.is_iocaine)" [title]="'TASK.TITLE_ACTION_IOCAINE' | tgTranslate">
            <img *ngIf="loading" class="loading-spinner" [src]="spinnerSrc" alt="loading..." />
            <label
                *ngIf="!loading"
                class="btn-icon is-iocaine"
                [class.is-editable]="editable"
                [class.active]="item.is_iocaine"
                (click)="toggle($event)"
            >
                <tg-svg svg-icon="icon-iocaine"></tg-svg>
            </label>
        </fieldset>
    `,
})
export class DetailIocaineButtonComponent {
    @Input() item: any;
    @Input() project: any;

    loading = false;
    readonly spinnerSrc = SPINNER();

    constructor(
        @Inject(AJS_QUEUE_MODEL_TRANSFORMATION) private modelTransform: any,
        @Inject(AJS_ROOT_SCOPE) private rootScope: any,
        @Inject(AJS_CONFIRM) private confirm: any,
    ) {}

    get editable(): boolean {
        return canEditWith(this.project, "modify_task");
    }

    toggle(event: Event): void {
        event.preventDefault();

        if (!this.editable) {
            return;
        }

        const value = !this.item.is_iocaine;
        this.loading = true;

        this.modelTransform
            .save((task: any) => {
                task.is_iocaine = value;
                return task;
            })
            .then(
                () => {
                    this.loading = false;
                    this.rootScope.$broadcast("object:updated");
                },
                () => {
                    this.loading = false;
                    this.confirm.notify("error");
                },
            );
    }
}

/**
 * Was tgBlockButton. Blocking opens `tg-lb-block` (`block` broadcast); unblocking asks it
 * to save directly (`unblock` broadcast with a finish callback), as before. The `editable`
 * class checks `modify_us` on every page, like the original.
 */
@Component({
    selector: "tg-detail-block-button",
    template: `
        <img *ngIf="unblocking" class="loading-spinner" [src]="spinnerSrc" alt="loading..." />
        <button
            *ngIf="item && !unblocking"
            class="btn-icon button-lock"
            [class.item-unblock]="item.is_blocked"
            [class.item-block]="!item.is_blocked"
            [class.editable]="editable"
            [title]="'COMMON.BLOCK_TITLE' | tgTranslate"
            (click)="toggle($event)"
        >
            <tg-svg svg-icon="icon-lock"></tg-svg>
        </button>
    `,
})
export class DetailBlockButtonComponent {
    @Input() item: any;
    @Input() project: any;

    unblocking = false;
    readonly spinnerSrc = SPINNER();

    constructor(@Inject(AJS_ROOT_SCOPE) private rootScope: any) {}

    get editable(): boolean {
        return canEditWith(this.project, "modify_us");
    }

    toggle(event: Event): void {
        event.preventDefault();

        if (!this.item.is_blocked) {
            this.rootScope.$broadcast("block", this.item);
            return;
        }

        this.unblocking = true;
        this.rootScope.$broadcast("unblock", this.item, () => {
            this.unblocking = false;
        });
    }
}

/** Was tgDeleteButton. */
@Component({
    selector: "tg-detail-delete-button",
    template: `
        <button class="btn-icon button-delete" variant="primary" (click)="remove()">
            <tg-svg svg-icon="icon-trash"></tg-svg>
        </button>
    `,
})
export class DetailDeleteButtonComponent {
    @Input() item: any;
    /** Already translated (interpolated in the jade caller). */
    @Input() deleteTitle: string;
    @Input() goToUrl: string;

    constructor(
        @Inject(AJS_REPO) private repo: any,
        @Inject(AJS_CONFIRM) private confirm: any,
        @Inject(AJS_TG_LOCATION) private location: any,
    ) {}

    remove(): void {
        this.confirm.askOnDelete(this.deleteTitle, this.item.subject).then((askResponse: any) => {
            this.repo.remove(this.item).then(
                () => {
                    askResponse.finish();
                    this.location.path(this.goToUrl);
                },
                () => {
                    askResponse.finish(false);
                    this.confirm.notify("error");
                },
            );
        });
    }
}

/** Was tgCreatedByDisplay (bindOnce: owner and date computed once the item is there). */
@Component({
    selector: "tg-detail-created-by",
    template: `
        <ng-container *ngIf="owner">
            <div class="created-by">
                <a class="created-title" [attr.href]="url" [title]="owner.full_name_display">{{
                    "COMMON.CREATED_BY" | tgTranslate: { fullDisplayName: owner.full_name_display }
                }}</a>
                <div class="created-date">{{ date }}</div>
            </div>
            <div class="user-avatar">
                <a [attr.href]="url" [title]="owner.full_name_display">
                    <img [style.background]="avatar.bg" [src]="avatar.url" [alt]="owner.full_name_display" />
                </a>
            </div>
        </ng-container>
    `,
})
export class DetailCreatedByComponent {
    owner: any;
    avatar: { url: string; bg: string };
    url = "";
    date = "";

    constructor(
        @Inject(AJS_AVATAR_SERVICE) private avatarService: any,
        @Inject(AJS_TRANSLATE) private translate: any,
        @Inject(AJS_NAV_URLS) private navUrls: any,
    ) {}

    @Input() set item(item: any) {
        if (!item || this.owner) {
            return;
        }

        this.avatar = this.avatarService.getAvatar(item.owner_extra_info);
        this.owner = item.owner_extra_info || { full_name_display: this.translate.instant("COMMON.EXTERNAL_USER") };
        this.url = this.owner.is_active ? this.navUrls.resolve("user-profile", { username: this.owner.username }) : "";
        this.date = moment(item.created_date).format(this.translate.instant("COMMON.DATETIME"));
    }
}

/**
 * Was tgLbBlock (attribute on `div.lightbox.lightbox-block`, now the element itself, same
 * name - downgraded components are element-only). Opens on `block`, saves directly on
 * `unblock` (with the caller's finish callback), both broadcast by the block button.
 */
@Component({
    selector: "tg-lb-block",
    template: `
        <a class="close" href="" [title]="'COMMON.CLOSE' | tgTranslate" (click)="close(); $event.preventDefault()">
            <tg-svg svg-icon="icon-close"></tg-svg>
        </a>
        <div class="form">
            <h2 class="title">{{ titleText }}</h2>
            <fieldset>
                <textarea class="reason" [placeholder]="'COMMON.BLOCKED_REASON' | tgTranslate" [(ngModel)]="reason"></textarea>
            </fieldset>
            <button class="btn-big button-block js-block-item" [disabled]="loading" (click)="block($event)">
                <img *ngIf="loading" class="loading-spinner" [src]="spinnerSrc" alt="loading..." />
                <span *ngIf="!loading">{{ "COMMON.SAVE" | tgTranslate }}</span>
            </button>
        </div>
    `,
})
export class LightboxBlockComponent implements OnInit, OnDestroy {
    @Input() item: any;
    /** Translation key or already-translated text (both went through `$translate.instant`). */
    @Input() lbTitle: string;

    reason = "";
    loading = false;
    readonly spinnerSrc = SPINNER();

    private unwatchers: Array<() => void> = [];

    constructor(
        private elementRef: ElementRef<HTMLElement>,
        @Inject(AJS_ROOT_SCOPE) private rootScope: any,
        @Inject(AJS_QUEUE_MODEL_TRANSFORMATION) private modelTransform: any,
        @Inject(AJS_CONFIRM) private confirm: any,
        @Inject(AJS_LIGHTBOX_SERVICE) private lightboxService: any,
        @Inject(AJS_TRANSLATE) private translate: any,
    ) {}

    get titleText(): string {
        return this.lbTitle ? this.translate.instant(this.lbTitle) : "";
    }

    ngOnInit(): void {
        this.unwatchers.push(
            this.rootScope.$on("block", () => {
                this.reason = this.item?.blocked_note || "";
                this.lightboxService.open($(this.elementRef.nativeElement));
            }),
            this.rootScope.$on("unblock", (_event: any, _item: any, finish: () => void) => this.unblock(finish)),
        );
    }

    ngOnDestroy(): void {
        this.unwatchers.forEach((unwatch) => unwatch());
    }

    close(): void {
        this.lightboxService.close($(this.elementRef.nativeElement));
    }

    block(event: Event): void {
        event.preventDefault();

        if (this.loading) {
            return;
        }

        const reason = this.reason;
        this.loading = true;

        this.modelTransform
            .save((item: any) => {
                item.is_blocked = true;
                item.blocked_note = reason;
                return item;
            })
            .then(
                () => {
                    this.confirm.notify("success");
                    this.rootScope.$broadcast("object:updated");
                },
                () => this.confirm.notify("error"),
            )
            .finally(() => {
                this.loading = false;
                this.close();
            });
    }

    private unblock(finish: () => void): void {
        this.modelTransform
            .save((item: any) => {
                item.is_blocked = false;
                item.blocked_note = "";
                return item;
            })
            .then(
                () => {
                    this.confirm.notify("success");
                    this.rootScope.$broadcast("object:updated");
                },
                () => this.confirm.notify("error"),
            )
            .finally(() => finish?.());
    }
}
