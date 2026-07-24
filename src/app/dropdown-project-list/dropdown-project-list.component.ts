import { Component, Inject, Input } from "@angular/core";
import { AJS_CURRENT_USER_SERVICE, AJS_PROJECT_LOGO_SERVICE, AJS_PROJECT_SERVICE, AJS_PROJECTS_SERVICE } from "../shared/ajs-tokens";

declare const Immutable: any;

/**
 * Angular replacement for the AngularJS `tgDropdownProjectList` directive
 * (app/modules/navigation-bar/dropdown-project-list/), downgraded in place under the same
 * name. Previously rejected for using `tg-nav` in its own template - now unblocked by the
 * Angular-native `TgNavDirective` (src/app/shared/tg-nav.directive.ts).
 *
 * The original had no controller, just `scope.vm = {}` built directly in its `link`
 * function - ported as plain component fields/getters. `tg-project-logo-small-src`
 * (template-less) replicated inline via `tgProjectLogoService`, same as `duty` earlier.
 *
 * The original also listened for a global `dropdown-project-list:updated` broadcast to
 * clear jQuery-cached `data("fullUrl", "")` on every link, forcing `tg-nav` to recompute
 * on next hover - that cache-invalidation dance is specific to the *old* `tg-nav`'s lazy,
 * jQuery-`.data()`-cached URL computation. `TgNavDirective` computes eagerly in
 * `ngOnChanges` and has no such cache to invalidate, so this component just re-renders
 * naturally whenever its own `@Input()`s (or the underlying immutable project list)
 * change - the broadcast listener isn't needed here.
 */
@Component({
    selector: "tg-dropdown-project-list",
    templateUrl: "./dropdown-project-list.component.html",
})
export class DropdownProjectListComponent {
    @Input() active: any;

    constructor(
        @Inject(AJS_CURRENT_USER_SERVICE) private currentUserService: any,
        @Inject(AJS_PROJECTS_SERVICE) private projectsService: any,
        @Inject(AJS_PROJECT_SERVICE) private projectService: any,
        @Inject(AJS_PROJECT_LOGO_SERVICE) private projectLogoService: any,
    ) {}

    /**
     * AngularJS's expression evaluation tolerates `vm.projects.size` when `vm.projects` is
     * undefined (returns undefined, no throw) - the "recents" key isn't set on
     * `currentUserService.projects` until a real projects fetch completes elsewhere.
     * Angular's strict template type-checking has no equivalent leniency, so this falls
     * back to an empty list rather than undefined to avoid a hard crash the original never
     * had.
     */
    get projects(): any {
        return this.currentUserService.projects.get("recents") || Immutable.List();
    }

    get currentProject(): any {
        return this.projectService.project ? this.projectService.project.get("id") : null;
    }

    /** Declared for fidelity - the original's `vm.newProject` was never referenced by its own template either. */
    newProject(): void {
        this.projectsService.newProject();
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
}
