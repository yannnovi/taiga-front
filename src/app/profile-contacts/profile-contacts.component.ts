import { Component, Inject, Input, OnInit } from "@angular/core";
import { AJS_AVATAR_SERVICE, AJS_CURRENT_USER_SERVICE, AJS_USER_SERVICE } from "../shared/ajs-tokens";

declare const window: any;

/**
 * Angular replacement for the AngularJS `tgProfileContacts` directive
 * (app/modules/profile/profile-contacts/), downgraded in place under the same name.
 * Previously rejected for using `tg-nav` in its own template - now unblocked by the
 * Angular-native `TgNavDirective`. `tg-avatar` (template-less) replicated inline via
 * `tgAvatarService`.
 */
@Component({
    selector: "tg-profile-contacts",
    templateUrl: "./profile-contacts.component.html",
})
export class ProfileContactsComponent implements OnInit {
    @Input() user: any;

    currentUser: any;
    isCurrentUser = false;
    contacts: any;
    spinnerSrc = `${window._version}/svg/spinner-circle.svg`;
    emptyContactImageSrc = `${window._version}/images/empty/empty_contact.png`;

    constructor(
        @Inject(AJS_USER_SERVICE) private userService: any,
        @Inject(AJS_CURRENT_USER_SERVICE) private currentUserService: any,
        @Inject(AJS_AVATAR_SERVICE) private avatarService: any,
    ) {}

    ngOnInit(): void {
        this.currentUser = this.currentUserService.getUser();
        this.isCurrentUser = !!(this.currentUser && this.currentUser.get("id") === this.user.get("id"));

        this.loadContacts();
    }

    private loadContacts(): void {
        this.userService.getContacts(this.user.get("id")).then((contacts: any) => {
            this.contacts = contacts;
        });
    }

    getAvatarUrl(contact: any): string {
        return this.avatarService.getAvatar(contact).url;
    }
}
