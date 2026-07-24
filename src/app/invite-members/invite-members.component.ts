import { Component, EventEmitter, Input, Output } from "@angular/core";

/**
 * Angular replacement for the AngularJS `tgInviteMembers` directive
 * (app/modules/projects/create/invite-members/), downgraded in place under the same name -
 * the avatar picker grid shown when creating a project. `@Output() toggleInvitedMember`
 * (not `onToggleInvitedMember`) so the existing `on-toggle-invited-member` attribute on the
 * one caller (duplicate-project.jade) keeps matching.
 */
@Component({
    selector: "tg-invite-members",
    templateUrl: "./invite-members.component.html",
})
export class InviteMembersComponent {
    @Input() invitedMembers: any;
    @Input() members: any;
    @Output() toggleInvitedMember = new EventEmitter<{ member: any }>();

    isDisabled(id: any): boolean {
        return this.invitedMembers.indexOf(id) === -1;
    }
}
