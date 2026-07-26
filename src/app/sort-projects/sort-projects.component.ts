import { Component, Inject, Input, OnChanges } from "@angular/core";
import { CdkDragDrop, moveItemInArray } from "@angular/cdk/drag-drop";
import { AJS_CURRENT_USER_SERVICE, AJS_PROJECT_LOGO_SERVICE } from "../shared/ajs-tokens";

declare const Immutable: any;

/**
 * Angular replacement for the AngularJS `tgSortProjects` directive
 * (app/modules/projects/components/sort-projects.directive.coffee), downgraded in place
 * under the same name. The original wrapped an existing `ul`/`tg-repeat` list with
 * `dragula` for reordering - since dragula is being replaced by
 * `@angular/cdk/drag-drop` (first module of that migration, see MIGRATION_ROADMAP.md),
 * the whole list (not just the drag wrapper) is internalized here as a real Angular
 * `*ngFor`, same as `epic-row`/`story-row` already internalize their own child lists -
 * there's no attempt to downgrade CDK's own directives into an AngularJS template.
 *
 * `tg-project-logo-small-src` (template-less) and the two `tg-nav` links replicated
 * inline using the same patterns as `dropdown-project-list`/`profile-projects`
 * (tgProjectLogoService / TgNavDirective). `tg-bind-scope` (AngularJS sub-scope
 * compilation) has no Angular equivalent needed - `*ngFor` already gives each item its
 * own context. `| limitTo:300` replicated as `.slice(0, 300)`.
 *
 * No `window.dragMultiple` involved here (unlike backlog/kanban) - single-item drag only,
 * matching @angular/cdk/drag-drop's default behavior with no custom code needed.
 *
 * The original never reordered its own scope data either - dragula physically moves the
 * dragged DOM node itself on drop, giving instant optimistic visual feedback, while
 * `currentUserService.bulkUpdateProjectsOrder` resolves later and refreshes the real list
 * from the server via `loadProjects()`. `@angular/cdk/drag-drop` has no equivalent
 * automatic DOM manipulation - the app is expected to reorder its own bound array on
 * `(cdkDropListDropped)` for the same optimistic effect, so `displayProjects` (a local
 * mutable copy, refreshed from `@Input() projects` on every change) exists for exactly
 * that: `drop()` reorders it immediately, then the real order is confirmed (or corrected)
 * once the parent's `@Input() projects` next updates from the server.
 */
@Component({
    selector: "tg-sort-projects",
    templateUrl: "./sort-projects.component.html",
})
export class SortProjectsComponent implements OnChanges {
    @Input() projects: any;

    displayProjects: any[] = [];

    constructor(
        @Inject(AJS_CURRENT_USER_SERVICE) private currentUserService: any,
        @Inject(AJS_PROJECT_LOGO_SERVICE) private projectLogoService: any,
    ) {}

    ngOnChanges(): void {
        this.displayProjects = this.projects ? this.projects.toArray() : [];
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

    drop(event: CdkDragDrop<any>): void {
        moveItemInArray(this.displayProjects, event.previousIndex, event.currentIndex);

        const sortData = this.displayProjects.map((project: any, index: number) => ({
            project_id: project.get("id"),
            order: index,
        }));

        this.currentUserService.bulkUpdateProjectsOrder(sortData);
    }
}
