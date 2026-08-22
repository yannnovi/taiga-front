import { Component, ElementRef, Inject, Input, OnChanges } from "@angular/core";
import {
    AJS_AVATAR_SERVICE,
    AJS_CURRENT_USER_SERVICE,
    AJS_TRANSLATE,
    AJS_USER_LIST_SERVICE,
} from "../shared/ajs-tokens";

declare const $: any;
declare const _: any;

/**
 * Angular replacement for the AngularJS `tgAssignedToInline` directive
 * (app/modules/components/assigned-inline/assigned-to-inline.directive.coffee),
 * downgraded in place under the same name - the single-assignee avatar/picker used inside
 * `tg-lb-create-edit`'s issue/task fields.
 *
 * The original never persisted anything itself (no `$repo.save`/`$modelTransform.save`) -
 * it only ever mutated its bound `ngModel` value directly (`$model.$modelValue.assigned_to
 * = ...`) and left saving to whatever owns the form. Same here: `@Input() item` is mutated
 * in place, no `@Output()` needed since the parent (`tg-lb-create-edit`) holds the same
 * object reference and reads it back at submit time.
 */
@Component({
    selector: "tg-assigned-to-inline",
    templateUrl: "./assigned-to-inline.component.html",
})
export class AssignedToInlineComponent implements OnChanges {
    @Input() item: any;
    @Input() usersById: Record<string, any> = {};
    @Input() requiredPerm: string;
    @Input() project: any;

    fullName = "";
    isUnassigned = true;
    isEditable = false;
    fullNameVisible = true;
    avatar: any;
    bg: string | null = null;

    usersSearch = "";
    users: any[] = [];
    showMore = false;

    constructor(
        private elementRef: ElementRef,
        @Inject(AJS_TRANSLATE) private translate: any,
        @Inject(AJS_CURRENT_USER_SERVICE) private currentUserService: any,
        @Inject(AJS_AVATAR_SERVICE) private avatarService: any,
        @Inject(AJS_USER_LIST_SERVICE) private userListService: any,
    ) {}

    ngOnChanges(): void {
        this.renderUser();
    }

    openUsersDropdown(event: MouseEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.usersSearch = "";
        this.renderUserList("");
        $(this.elementRef.nativeElement).find(".pop-users").popover().open();
    }

    onSearchChange(): void {
        this.renderUserList(this.usersSearch);

        const el = this.elementRef.nativeElement;

        setTimeout(() => el.querySelector(".users-search")?.focus(), 0);
    }

    selfAssign(): void {
        this.item.assigned_to = this.currentUserService.getUser().get("id");
        this.renderUser();
    }

    unassign(): void {
        this.item.assigned_to = null;
        this.renderUser();
    }

    selectUser(user: any): void {
        this.item.assigned_to = user.id;
        this.renderUser();
    }

    private renderUserList(text: string): void {
        const selectedId = this.item?.assigned_to;
        let users = this.userListService.searchUsers(text);

        if (selectedId) {
            users = _.reject(users, { id: selectedId });
        }

        this.users = _.slice(users, 0, 5).map((user: any) => ({ ...user, avatar: this.avatarService.getAvatar(user) }));
        this.showMore = users.length > 5;
    }

    private renderUser(): void {
        if (this.item?.assigned_to) {
            const info = this.usersById[this.item.assigned_to];

            this.fullName = info?.full_name_display;
            this.isUnassigned = false;
            this.avatar = this.avatarService.getAvatar(info);
            this.bg = this.avatar.bg;
        } else {
            this.fullName = this.translate.instant("COMMON.ASSIGNED_TO.ASSIGN");
            this.isUnassigned = true;
            this.avatar = this.avatarService.getAvatar(null);
            this.bg = null;
        }

        this.fullNameVisible = !(this.isUnassigned && !this.currentUserService.isAuthenticated());
        this.isEditable = !this.project?.archived_code && this.project?.my_permissions?.indexOf(this.requiredPerm) > -1;
    }
}
