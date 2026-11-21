import { Component, EventEmitter, Inject, Input, Output } from "@angular/core";
import {
    AJS_AVATAR_SERVICE,
    AJS_CONFIRM,
    AJS_CURRENT_USER_SERVICE,
    AJS_LIGHTBOX_FACTORY,
    AJS_NAV_URLS,
    AJS_TG_LOCATION,
    AJS_TG_RESOURCES,
    AJS_TRANSLATE,
} from "../shared/ajs-tokens";

/**
 * Was `tgTeamFilters` + the `includes/modules/team/team-filters.jade` block around it:
 * name search and role filter of the team page sidebar. The original wrote `filtersQ`
 * straight onto the ambient `TeamController` scope through `ng-model`; here the query goes
 * back through `ctrl.setQuery($event)` (an assignment in an `on-*` expression would land on
 * the downgraded component's child scope) and the role through `ctrl.setRole($event)`.
 */
@Component({
    selector: "tg-team-filters",
    template: `
        <section class="team-filters">
            <div class="team-filters-inner">
                <header>
                    <h1>{{ "BACKLOG.FILTERS.TITLE" | tgTranslate }}</h1>
                </header>
                <form class="search-in" (submit)="$event.preventDefault()">
                    <fieldset>
                        <input
                            type="text"
                            name="q"
                            [placeholder]="'TEAM.PLACEHOLDER_INPUT_SEARCH' | tgTranslate"
                            [ngModel]="query"
                            (ngModelChange)="onQuery($event)"
                        />
                        <div class="icon-search-wrapper">
                            <tg-svg svg-icon="icon-search" [attr.title]="'COMMON.FILTERS.TITLE_ACTION_FILTER_BUTTON' | tgTranslate"></tg-svg>
                        </div>
                    </fieldset>
                </form>
                <nav>
                    <ul>
                        <li [class.active]="!filtersRole?.id">
                            <a href="" (click)="selectRole.emit(null); $event.preventDefault()">
                                <span class="title">{{ "TEAM.SECTION_FILTER_ALL" | tgTranslate }}</span>
                                <tg-svg svg-icon="icon-arrow-right"></tg-svg>
                            </a>
                        </li>
                        <li *ngFor="let role of roles" [class.active]="role.id === filtersRole?.id">
                            <a href="" (click)="selectRole.emit(role); $event.preventDefault()">
                                <span class="title">{{ role.name }}</span>
                                <tg-svg svg-icon="icon-arrow-right"></tg-svg>
                            </a>
                        </li>
                    </ul>
                </nav>
            </div>
        </section>
    `,
})
export class TeamFiltersComponent {
    @Input() roles: any[] = [];
    @Input() filtersRole: any;

    @Output() queryChange = new EventEmitter<string>();
    @Output() selectRole = new EventEmitter<any>();

    query = "";

    onQuery(value: string): void {
        this.query = value;
        this.queryChange.emit(value);
    }
}

/**
 * Was the `includes/modules/team/team-table.jade` block with `tgTeamCurrentUser`,
 * `tgTeamMembers`, `tgTeamMemberStats`, `tgLeaveProject` and the `membersFilter` filter:
 * the team page table. All read `TeamController`'s scope (through `=` bindings fed from
 * ambient values); same data now as explicit inputs.
 *
 * Fixed while porting: leaving the project when the API refused showed nothing - the error
 * handler shadowed the confirm dialog's `response` with the HTTP error and called
 * `.finish()` on it (TypeError), so the dialog spinner never stopped and no message showed.
 */
@Component({
    selector: "tg-team-table",
    templateUrl: "./team-table.component.html",
})
export class TeamTableComponent {
    @Input() project: any;
    @Input() currentUser: any;
    @Input() memberships: any[] = [];
    @Input() stats: any;
    @Input() filtersQ: string;
    @Input() filtersRole: any;
    @Input() issuesEnabled: boolean;
    @Input() tasksEnabled: boolean;
    @Input() wikiEnabled: boolean;
    @Input() owner: any;

    constructor(
        @Inject(AJS_AVATAR_SERVICE) private avatarService: any,
        @Inject(AJS_TRANSLATE) private translate: any,
        @Inject(AJS_CONFIRM) private confirm: any,
        @Inject(AJS_TG_RESOURCES) private rs: any,
        @Inject(AJS_CURRENT_USER_SERVICE) private currentUserService: any,
        @Inject(AJS_TG_LOCATION) private location: any,
        @Inject(AJS_NAV_URLS) private navUrls: any,
        @Inject(AJS_LIGHTBOX_FACTORY) private lightboxFactory: any,
    ) {}

    trackById(_index: number, user: any): any {
        return user.id;
    }

    avatar(user: any): { url: string; bg: string; fullName: string } {
        return this.avatarService.getAvatar(user, "avatar");
    }

    /** Was the `membersFilter` filter (role, then a case-insensitive regexp on the name). */
    get filteredMembers(): any[] {
        const role = this.filtersRole;
        const q = this.filtersQ;
        let regexp: RegExp | null = null;

        if (q) {
            try {
                regexp = new RegExp(q, "i");
            } catch {
                regexp = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
            }
        }

        return (this.memberships || []).filter(
            (m) => (!role || m.role === role.id) && (!regexp || `${m.full_name}`.search(regexp) >= 0),
        );
    }

    stat(name: string, userId: any): number | undefined {
        return this.stats?.[name]?.[userId];
    }

    /** Was `tgLeaveProject`. */
    leave(event: Event): void {
        event.preventDefault();

        if (this.project.owner.id === this.currentUser.id) {
            this.lightboxFactory.create(
                "tg-lightbox-leave-project-warning",
                { class: "lightbox lightbox-leave-project-warning" },
                { isCurrentUser: true, project: this.project },
            );
            return;
        }

        const title = this.translate.instant("TEAM.ACTION_LEAVE_PROJECT");
        const message = this.translate.instant("TEAM.CONFIRM_LEAVE_PROJECT");

        this.confirm.ask(title, message).then((askResponse: any) => {
            this.rs.projects.leave(this.project.id).then(
                () => {
                    this.currentUserService.loadProjects().then(() => {
                        askResponse.finish();
                        this.confirm.notify("success");
                        this.location.path(this.navUrls.resolve("home"));
                    });
                },
                (error: any) => {
                    askResponse.finish(false);
                    this.confirm.notify("error", error?.data?._error_message);
                },
            );
        });
    }
}
