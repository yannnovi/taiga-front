import { Component, EventEmitter, Inject, Input, OnChanges, Output } from "@angular/core";
import { AJS_AVATAR_SERVICE } from "../shared/ajs-tokens";

declare const taiga: any;

/**
 * Angular replacement for the AngularJS `tgSuggestAddMembers` directive
 * (app/modules/invite-members/suggest-add-members/), downgraded in place under the same
 * name. `@Output()`s named `inviteSuggested`/`inviteEmail` (not `onInviteSuggested`/
 * `onInviteEmail`) so the existing `on-invite-suggested`/`on-invite-email` attributes on
 * the one caller (lightbox-add-members.jade) keep matching - same gotcha as everywhere
 * else in this migration. Caller's invoked expressions switch to `$event.contact`/
 * `$event.email`.
 */
@Component({
    selector: "tg-suggest-add-members",
    templateUrl: "./suggest-add-members.component.html",
})
export class SuggestAddMembersComponent implements OnChanges {
    @Input() contacts: any;
    @Output() inviteSuggested = new EventEmitter<{ contact: any }>();
    @Output() inviteEmail = new EventEmitter<{ email: string }>();

    contactQuery = "";
    filteredContacts: any;

    constructor(@Inject(AJS_AVATAR_SERVICE) private avatarService: any) {}

    getAvatarUrl(contact: any): string {
        return this.avatarService.getAvatar(contact).url;
    }

    ngOnChanges(): void {
        if (this.contacts) {
            this.filterContacts();
        }
    }

    isEmail(): boolean {
        return taiga.isEmail(this.contactQuery);
    }

    filterContacts(): void {
        this.filteredContacts = this.contacts
            .filter(
                (contact: any) =>
                    contact.get("full_name_display").toLowerCase().includes(this.contactQuery.toLowerCase()) ||
                    contact.get("username").toLowerCase().includes(this.contactQuery.toLowerCase()),
            )
            .slice(0, 12);
    }

    setInvited(contact: any): void {
        this.inviteSuggested.emit({ contact });
    }

    sendEmailInvite(): void {
        this.inviteEmail.emit({ email: this.contactQuery });
    }
}
