import { Component, Inject, Input, OnInit } from "@angular/core";
import {
    AJS_AVATAR_SERVICE,
    AJS_PROJECT_LOGO_SERVICE,
    AJS_PROJECTS_SERVICE,
    AJS_USER_SERVICE,
} from "../shared/ajs-tokens";

declare const window: any;
declare const Immutable: any;

/**
 * Angular replacement for the AngularJS `tgProfileProjects` directive
 * (app/modules/profile/profile-projects/), downgraded in place under the same name.
 * Previously rejected for using `tg-nav` in its own template - now unblocked.
 *
 * `tg-project-logo-small-src`/`tg-avatar` (both template-less) replicated inline, same
 * pattern as `duty`/`dropdown-project-list` earlier. The original's `| limitTo:300` Angular
 * filter replicated as a plain `.slice(0, 300)` (there is no Angular equivalent pipe named
 * `limitTo` - `slice` is Angular's own built-in, but `.slice()` directly is simpler for a
 * one-off truncation than importing another pipe).
 */
@Component({
    selector: "tg-profile-projects",
    templateUrl: "./profile-projects.component.html",
})
export class ProfileProjectsComponent implements OnInit {
    @Input() user: any;

    projects: any;
    spinnerSrc = `${window._version}/svg/spinner-circle.svg`;

    constructor(
        @Inject(AJS_PROJECTS_SERVICE) private projectsService: any,
        @Inject(AJS_USER_SERVICE) private userService: any,
        @Inject(AJS_AVATAR_SERVICE) private avatarService: any,
        @Inject(AJS_PROJECT_LOGO_SERVICE) private projectLogoService: any,
    ) {}

    ngOnInit(): void {
        this.loadProjects();
    }

    private loadProjects(): void {
        this.projectsService
            .getProjectsByUserId(this.user.get("id"))
            .then((projects: any) => this.userService.attachUserContactsToProjects(this.user.get("id"), projects))
            .then((projects: any) => {
                this.projects = projects;
            });
    }

    getAvatarUrl(contact: any): string {
        return this.avatarService.getAvatar(contact).url;
    }

    getProjectLogoUrl(project: any): string {
        const p = Immutable.fromJS(project);
        const logoSmallUrl = p.get("logo_small_url");

        if (logoSmallUrl) {
            return logoSmallUrl;
        }

        return this.projectLogoService.getDefaultProjectLogo(p.get("slug"), p.get("id")).src;
    }

    getProjectLogoBg(project: any): string {
        const p = Immutable.fromJS(project);

        if (p.get("logo_small_url")) {
            return "";
        }

        return this.projectLogoService.getDefaultProjectLogo(p.get("slug"), p.get("id")).color;
    }

    descriptionPreview(project: any): string {
        return (project.get("description") || "").slice(0, 300);
    }
}
