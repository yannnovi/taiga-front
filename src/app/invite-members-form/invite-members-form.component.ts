import { Component, EventEmitter, Inject, Input, OnInit, Output } from "@angular/core";
import {
    AJS_AVATAR_SERVICE,
    AJS_CONFIRM,
    AJS_LIGHTBOX_SERVICE,
    AJS_PROJECT_SERVICE,
    AJS_ROOT_SCOPE,
    AJS_TG_RESOURCES,
} from "../shared/ajs-tokens";

declare const _: any;
declare const window: any;

/**
 * Angular replacement for the AngularJS `tgInviteMembersForm` directive
 * (app/modules/invite-members/invite-members-form/), downgraded in place under the same
 * name.
 *
 * `@Output()`s named `displayContactList`/`removeInvitedContact`/`removeInvitedEmail` (not
 * `onDisplayContactList`/etc.) so the existing `on-display-contact-list`/
 * `on-remove-invited-contact`/`on-remove-invited-email` attributes on the one caller
 * (lightbox-add-members.jade) keep matching. `onSendInvites` (`&`, declared in the
 * original's bindToController) was never actually invoked anywhere in the original
 * controller or template - genuinely dead - so `sendInvites` is declared here too but
 * never emitted, for fidelity rather than silently dropping a declared output.
 *
 * The original's `| toMutable` filter (converts an Immutable structure to a plain JS one)
 * is dropped entirely - Angular's `*ngFor` iterates `Immutable.List`/`Map` natively
 * (`Symbol.iterator`), same as everywhere else in this migration. `tg-avatar` (template-less)
 * replicated inline via `tgAvatarService`, same as history-entry/suggest-add-members.
 */
@Component({
    selector: "tg-invite-members-form",
    templateUrl: "./invite-members-form.component.html",
})
export class InviteMembersFormComponent implements OnInit {
    @Input() contactsToInvite: any;
    @Input() emailsToInvite: any;
    @Output() displayContactList = new EventEmitter<void>();
    @Output() removeInvitedContact = new EventEmitter<{ contact: any }>();
    @Output() removeInvitedEmail = new EventEmitter<{ email: any }>();
    /** Declared for fidelity - never emitted, same as the original AngularJS binding. */
    @Output() sendInvites = new EventEmitter<any>();

    project: any;
    roles: any;
    rolesValues: Record<string, any> = {};
    loading = false;
    defaultMaxInvites = 4;
    membersLimit = 0;
    showWarningMessage = false;
    inviteContactsMessage = "";
    spinnerSrc = `${window._version}/svg/spinner-circle.svg`;

    private setInvitedContacts: any[] = [];

    constructor(
        @Inject(AJS_PROJECT_SERVICE) private projectService: any,
        @Inject(AJS_TG_RESOURCES) private rs: any,
        @Inject(AJS_LIGHTBOX_SERVICE) private lightboxService: any,
        @Inject(AJS_CONFIRM) private confirm: any,
        @Inject(AJS_ROOT_SCOPE) private rootScope: any,
        @Inject(AJS_AVATAR_SERVICE) private avatarService: any,
    ) {}

    getAvatarUrl(contact: any): string {
        return this.avatarService.getAvatar(contact).url;
    }

    ngOnInit(): void {
        this.project = this.projectService.project;
        this.roles = this.projectService.project.get("roles");
        this.checkLimitMemberships();
    }

    get areRolesValidated(): boolean {
        const roleIds = _.filter(_.values(this.rolesValues), (it: any) => it);

        return roleIds.length === this.contactsToInvite.size + this.emailsToInvite.size;
    }

    private checkLimitMemberships(): void {
        if (this.project.get("max_memberships") === null) {
            this.membersLimit = this.defaultMaxInvites;
        } else {
            const pendingMembersCount = Math.max(
                this.project.get("max_memberships") - this.project.get("total_memberships"),
                0,
            );
            this.membersLimit = Math.min(pendingMembersCount, this.defaultMaxInvites);
        }

        this.showWarningMessage = this.membersLimit < this.defaultMaxInvites;
    }

    onSubmit(): void {
        this.sendInvitesToServer();
    }

    private sendInvitesToServer(): void {
        this.setInvitedContacts = [];

        _.forEach(this.rolesValues, (value: any, key: string) => {
            this.setInvitedContacts.push({ role_id: value, username: key });
        });

        this.loading = true;

        this.rs.memberships
            .bulkCreateMemberships(this.project.get("id"), this.setInvitedContacts, this.inviteContactsMessage)
            .then(() => {
                this.projectService.fetchProject().then(() => {
                    this.loading = false;
                    this.lightboxService.closeAll();
                    this.rootScope.$broadcast("membersform:new:success");
                    this.confirm.notify("success");
                });
            })
            .catch((response: any) => {
                this.loading = false;

                if (response.data._error_message) {
                    this.confirm.notify("error", response.data._error_message);
                } else if (response.data.__all__) {
                    this.confirm.notify("error", response.data.__all__[0]);
                }
            });
    }
}
