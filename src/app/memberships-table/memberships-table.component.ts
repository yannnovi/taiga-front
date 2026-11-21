import { Component, EventEmitter, Inject, Input, Output } from "@angular/core";
import {
    AJS_AUTH,
    AJS_AVATAR_SERVICE,
    AJS_CONFIRM,
    AJS_LIGHTBOX_FACTORY,
    AJS_NAV_URLS,
    AJS_PROJECT_SERVICE,
    AJS_REPO,
    AJS_TG_LOCATION,
    AJS_TG_RESOURCES,
    AJS_TRANSLATE,
} from "../shared/ajs-tokens";

interface PageItem {
    type: "page" | "page-active" | "dots";
    num?: number;
}

/**
 * Admin > Members table. Was `includes/modules/admin/admin-membership-table.jade` with the
 * four row directives `tgMembershipsRowAvatar`, `tgMembershipsRowAdminCheckbox`,
 * `tgMembershipsRowRoleSelector`, `tgMembershipsRowActions`, plus the paginator half of
 * `tgMemberships` (all reading `MembershipsController`'s scope and calling it through
 * `$el.controller()`). `MembershipsController` is unchanged: paging and reloading go back
 * through outputs bound to its existing methods in the jade
 * (`ctrl.selectFilter('page', n); ctrl.loadMembers()`, `ctrl.loadInitialData()`).
 *
 * Same behaviour as before: admin checkbox and role select save the membership model right
 * away (the admin checkbox reverts on error with the API message), "resend" re-sends a
 * pending invitation, delete asks for confirmation - removing the project owner opens the
 * leave-project warning instead, removing yourself sends you home, and deleting the last
 * row of a page goes back one page.
 */
@Component({
    selector: "tg-memberships-table",
    templateUrl: "./memberships-table.component.html",
})
export class MembershipsTableComponent {
    @Input() memberships: any[] = [];
    @Input() project: any;
    @Input() page = 1;
    @Input() count = 0;
    @Input() paginatedBy = 1;

    @Output() pageChange = new EventEmitter<number>();
    /** Emitted after a member was removed; payload: page to go back to, or null. */
    @Output() reload = new EventEmitter<number | null>();

    constructor(
        @Inject(AJS_AVATAR_SERVICE) private avatarService: any,
        @Inject(AJS_TRANSLATE) private translate: any,
        @Inject(AJS_REPO) private repo: any,
        @Inject(AJS_CONFIRM) private confirm: any,
        @Inject(AJS_TG_RESOURCES) private rs: any,
        @Inject(AJS_AUTH) private auth: any,
        @Inject(AJS_PROJECT_SERVICE) private projectService: any,
        @Inject(AJS_TG_LOCATION) private location: any,
        @Inject(AJS_NAV_URLS) private navUrls: any,
        @Inject(AJS_LIGHTBOX_FACTORY) private lightboxFactory: any,
    ) {}

    trackById(_index: number, member: any): any {
        return member.id;
    }

    avatar(member: any): { url: string; bg: string } {
        return this.avatarService.getAvatar(member);
    }

    email(member: any): string {
        return member.user_email ? member.user_email : member.email;
    }

    // Pagination (was the tgMemberships paginator)

    get numPages(): number {
        return Math.ceil(this.count / this.paginatedBy) || 0;
    }

    get pages(): PageItem[] {
        const afterCurrent = 2;
        const beforeCurrent = 4;
        const atBegin = 2;
        const atEnd = 2;
        const numPages = this.numPages;
        const cpage = this.page;
        const pages: PageItem[] = [];

        for (let i = 1; i <= numPages; i++) {
            if (i === cpage + afterCurrent && numPages > cpage + afterCurrent + atEnd) {
                pages.push({ type: "dots" });
            } else if (i === cpage - beforeCurrent && cpage > atBegin + beforeCurrent) {
                pages.push({ type: "dots" });
            } else if (i > cpage + afterCurrent && i <= numPages - atEnd) {
                // skipped
            } else if (i < cpage - beforeCurrent && i > atBegin) {
                // skipped
            } else if (i === cpage) {
                pages.push({ type: "page-active", num: i });
            } else {
                pages.push({ type: "page", num: i });
            }
        }

        return pages;
    }

    goTo(page: number, event: Event): void {
        event.preventDefault();
        this.pageChange.emit(page);
    }

    // Row actions

    toggleAdmin(member: any, event: Event): void {
        const checked = (event.target as HTMLInputElement).checked;
        member.is_admin = checked;

        this.repo.save(member).then(
            () => this.confirm.notify("success"),
            (data: any) => {
                member.revert?.();
                (event.target as HTMLInputElement).checked = !!member.is_admin;
                this.confirm.notify("error", data?.is_admin?.[0]);
            },
        );
    }

    changeRole(member: any, value: string): void {
        const newRole = parseInt(value, 10);

        if (member.role === newRole) {
            return;
        }

        member.role = newRole;
        this.repo.save(member).then(
            () => this.confirm.notify("success"),
            () => this.confirm.notify("error"),
        );
    }

    resend(member: any, event: Event): void {
        event.preventDefault();

        this.rs.memberships.resendInvitation(member.id).then(
            () => this.confirm.notify("success", this.translate.instant("ADMIN.MEMBERSHIP.SUCCESS_SEND_INVITATION", { email: member.email })),
            () => this.confirm.notify("error", this.translate.instant("ADMIN.MEMBERSHIP.ERROR_SEND_INVITATION")),
        );
    }

    remove(member: any, event: Event): void {
        event.preventDefault();

        const currentUserId = this.auth.getUser()?.id;

        if (this.project.owner.id === member.user) {
            this.lightboxFactory.create(
                "tg-lightbox-leave-project-warning",
                { class: "lightbox lightbox-leave-project-warning" },
                { isCurrentUser: currentUserId === member.user, project: this.project },
            );
            return;
        }

        const title = this.translate.instant("ADMIN.MEMBERSHIP.DELETE_MEMBER");
        const defaultMsg = this.translate.instant("ADMIN.MEMBERSHIP.DEFAULT_DELETE_MESSAGE", { email: member.email });
        const message = member.user ? member.full_name : defaultMsg;

        this.confirm.askOnDelete(title, message).then((askResponse: any) => {
            this.repo.remove(member).then(
                () => {
                    askResponse.finish();

                    if (member.user !== currentUserId) {
                        const backPage = this.page > 1 && this.count - 1 <= this.paginatedBy ? this.page - 1 : null;
                        this.projectService.fetchProject().then(() => this.reload.emit(backPage));
                    } else {
                        this.location.path(this.navUrls.resolve("home"));
                    }

                    this.confirm.notify("success", this.translate.instant("ADMIN.MEMBERSHIP.SUCCESS_DELETE", { message }), null, 5000);
                },
                () => {
                    askResponse.finish(false);
                    this.confirm.notify("error", this.translate.instant("ADMIN.MEMBERSHIP.ERROR_DELETE", { message }));
                },
            );
        });
    }
}
