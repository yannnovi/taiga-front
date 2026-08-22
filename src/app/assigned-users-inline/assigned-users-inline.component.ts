import { Component, ElementRef, Inject, Input, OnChanges } from "@angular/core";
import { AJS_AVATAR_SERVICE, AJS_CURRENT_USER_SERVICE, AJS_USER_LIST_SERVICE } from "../shared/ajs-tokens";

declare const $: any;
declare const _: any;

/**
 * Angular replacement for the AngularJS `tgAssignedUsersInline` directive
 * (app/modules/components/assigned-inline/assigned-users-inline.directive.coffee),
 * downgraded in place under the same name - the multi-assignee avatar/picker used inside
 * `tg-lb-create-edit`'s US fields. Same non-persisting behavior as
 * `AssignedToInlineComponent` - mutates `@Input() item` in place, no save call of its own.
 *
 * One quirk ported as-is, not fixed: the original's `$scope.$watch ngModel` handler read
 * `item.assigned_to` into a local `assigned_to` variable that was never actually used
 * anywhere afterward (`currentAssignedTo`, the variable `applyToModel` really reads, was
 * never initialized from it) - so `currentAssignedTo` always starts falsy and gets reset to
 * the first assigned id on the very first assign/unassign call, regardless of whatever
 * `assigned_to` already held. Reproduced by simply never seeding `currentAssignedTo` either.
 */
@Component({
    selector: "tg-assigned-users-inline",
    templateUrl: "./assigned-users-inline.component.html",
})
export class AssignedUsersInlineComponent implements OnChanges {
    @Input() item: any;
    @Input() usersById: Record<string, any> = {};

    assignedUsers: any[] = [];
    hiddenUsers = 0;
    isAssigned = false;

    usersSearch = "";
    users: any[] = [];
    selected: any[] = [];
    showMore = false;

    private currentAssignedIds: any[] = [];
    private currentAssignedTo: any = null;

    constructor(
        private elementRef: ElementRef,
        @Inject(AJS_CURRENT_USER_SERVICE) private currentUserService: any,
        @Inject(AJS_AVATAR_SERVICE) private avatarService: any,
        @Inject(AJS_USER_LIST_SERVICE) private userListService: any,
    ) {}

    ngOnChanges(): void {
        if (!this.item) {
            return;
        }

        this.currentAssignedIds = this.item.assigned_users || [];
        this.renderUsers();
    }

    openUsersDropdown(event: MouseEvent): void {
        event.preventDefault();
        event.stopPropagation();
        this.usersSearch = "";
        this.renderUsersList("");
        $(this.elementRef.nativeElement).find(".pop-users").popover().open();
    }

    onSearchChange(): void {
        this.renderUsersList(this.usersSearch);

        const el = this.elementRef.nativeElement;

        setTimeout(() => el.querySelector(".users-search")?.focus(), 0);
    }

    assign(user: any): void {
        this.currentAssignedIds.push(user.id);
        this.renderUsers();
        this.applyToModel();
    }

    selfAssign(): void {
        this.currentAssignedIds.push(this.currentUserService.getUser().get("id"));
        this.renderUsers();
        this.applyToModel();
    }

    unassign(user: any): void {
        const index = this.currentAssignedIds.indexOf(user.id);

        this.currentAssignedIds.splice(index, 1);
        this.renderUsers();
        this.applyToModel();
    }

    isSelected(user: any): boolean {
        return this.selected.indexOf(user) > -1;
    }

    private renderUsersList(text: string): void {
        const users = this.userListService.searchUsers(text);
        const selected: any[] = [];
        const visible: any[] = [];

        users.forEach((user: any) => {
            if (this.currentAssignedIds.indexOf(user.id) > -1) {
                selected.push({ ...user, avatar: this.avatarService.getAvatar(user) });
            } else {
                visible.push({ ...user, avatar: this.avatarService.getAvatar(user) });
            }
        });

        this.selected = _.slice(selected, 0, 5);
        this.users = this.selected.length < 5 ? _.slice(visible, 0, 5 - this.selected.length) : [];
        this.showMore = users.length > 5;
    }

    private renderUsers(): void {
        const assignedUsers = this.currentAssignedIds
            .map((id: any) => this.usersById[id])
            .filter((it: any) => !!it);

        this.hiddenUsers = this.currentAssignedIds.length > 3 ? this.currentAssignedIds.length - 3 : 0;
        this.assignedUsers = assignedUsers.slice(0, 3);
        this.isAssigned = this.currentAssignedIds.length > 0;
    }

    private applyToModel(): void {
        this.currentAssignedIds = this.currentAssignedIds.filter((userId: any) => !!this.usersById[userId]);

        if (this.currentAssignedIds.length === 0) {
            this.currentAssignedTo = null;
        } else if (this.currentAssignedIds.indexOf(this.currentAssignedTo) === -1 || !this.currentAssignedTo) {
            this.currentAssignedTo = this.currentAssignedIds[0];
        }

        if (!this.item.assigned_users) {
            this.item.assigned_users = this.currentAssignedIds;
        } else {
            this.item.setAttr("assigned_users", this.currentAssignedIds);
        }

        this.item.assigned_to = this.currentAssignedTo;
    }
}
