import { Component, Inject, OnInit } from "@angular/core";
import { AJS_CURRENT_USER_SERVICE, AJS_PROJECT_SERVICE, AJS_USER_SERVICE } from "../shared/ajs-tokens";

declare const Immutable: any;

/**
 * Angular replacement for the AngularJS `tgLbAddMembers` directive
 * (app/modules/invite-members/lightbox-add-members.directive.coffee), downgraded in place
 * under the same name. The original's `scope: {}` was truly empty (no bindToController at
 * all) - the `"project": "project"` attrs/scopeAttrs passed by the one caller
 * (`lightboxFactory.create` in app/coffee/modules/admin/memberships.coffee) were never
 * actually read anywhere (neither the controller nor the template referenced a `project`
 * scope property) - genuinely dead wiring, so no `@Input()` is needed here either; the
 * controller always used `tgProjectService.project` directly.
 *
 * `tg-lightbox-close` (bare, no `on-close`) relied on the *generic* `.lightbox` class-based
 * click delegation (`LightboxDirective`, `restrict: "C"`, app/coffee/modules/common/lightboxes.coffee)
 * rather than its own `onClose` binding - that generic AngularJS directive still applies
 * to the outer `.lightbox` wrapper element created by `lightboxFactory.create`, regardless
 * of the downgraded component nested inside it, so a plain close link with no handler here
 * is faithful to the original's bare usage.
 *
 * Both children (`tg-suggest-add-members`, `tg-invite-members-form`) are already
 * downgraded Angular components from earlier batches.
 */
@Component({
    selector: "tg-lb-add-members",
    templateUrl: "./lightbox-add-members.component.html",
})
export class LightboxAddMembersComponent implements OnInit {
    contactsToInvite: any = Immutable.List();
    emailsToInvite: any = Immutable.List();
    contacts: any = Immutable.List();
    displayContactList = false;

    constructor(
        @Inject(AJS_USER_SERVICE) private userService: any,
        @Inject(AJS_CURRENT_USER_SERVICE) private currentUserService: any,
        @Inject(AJS_PROJECT_SERVICE) private projectService: any,
    ) {}

    ngOnInit(): void {
        const userId = this.currentUserService.getUser().get("id");
        const excludeProjectId = this.projectService.project.get("id");

        this.userService.getContacts(userId, excludeProjectId).then((contacts: any) => {
            this.contacts = contacts;
        });
    }

    private filterContacts(invited: any): void {
        this.contacts = this.contacts.filter((contact: any) => contact.get("id") !== invited.get("id"));
    }

    inviteSuggested(contact: any): void {
        this.contactsToInvite = this.contactsToInvite.push(contact);
        this.filterContacts(contact);
        this.displayContactList = true;
    }

    removeContact(invited: any): void {
        this.contactsToInvite = this.contactsToInvite.filter((contact: any) => contact.get("id") !== invited.id);
        this.contacts = this.contacts.push(Immutable.fromJS(invited));
        this.testEmptyContacts();
    }

    inviteEmail(email: string): void {
        this.emailsToInvite = this.emailsToInvite.push(Immutable.Map({ email }));
        this.displayContactList = true;
    }

    removeEmail(invited: any): void {
        this.emailsToInvite = this.emailsToInvite.filter((email: any) => email.get("email") !== invited.email);
        this.testEmptyContacts();
    }

    private testEmptyContacts(): void {
        if (this.emailsToInvite.size + this.contactsToInvite.size === 0) {
            this.displayContactList = false;
        }
    }
}
