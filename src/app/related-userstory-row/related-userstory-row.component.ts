import { Component, EventEmitter, Inject, Input, OnChanges, Output } from "@angular/core";
import { AJS_AVATAR_SERVICE, AJS_CONFIRM, AJS_PROJECT_LOGO_SERVICE, AJS_PROJECT_SERVICE, AJS_RESOURCES, AJS_TRANSLATE } from "../shared/ajs-tokens";

declare const Immutable: any;

/**
 * Angular replacement for the AngularJS `tgRelatedUserstoryRow` directive
 * (app/modules/epics/related-userstories/related-userstory-row/), downgraded in place
 * under the same name - a single user story row inside an epic's "related user stories"
 * list (the parent `related-userstories` stays AngularJS - see MIGRATION.md's
 * `*-sortable` exclusion). Previously rejected for using `tg-nav` in its own template -
 * now unblocked. Uses the already-migrated `tg-belong-to-epics` natively.
 *
 * `@Output() loadRelatedUserstories` (not `onLoadRelatedUserstories`) - `downgradeComponent`
 * always maps an `@Output()` to `"on" + capitalize(propName)`, so an output named
 * `loadRelatedUserstories` maps to `on-load-related-userstories`, not the original's plain
 * `load-related-userstories` attribute - the one caller (related-userstories.jade) needed
 * updating for this, unlike the "avoid the on- collision" cases elsewhere in this
 * migration where the fix was renaming the *property* instead.
 *
 * `tg-check-permission` (both usages, hardcoded "modify_epic") and
 * `tg-project-logo-small-src` (template-less) replicated inline, same patterns used
 * throughout this migration. `tgResources.epics.deleteRelatedUserstory` uses the
 * *smaller* resources aggregator (AJS_RESOURCES), matching the original's plain
 * `"tgResources"` injection (not `"$tgResources"`).
 *
 * The original template's trailing `div(tg-related-userstories-create-form)` doesn't
 * match any registered directive anywhere in the codebase (the real one is
 * `tgRelatedUserstoriesCreate`, no "-form" suffix, used correctly elsewhere) - always
 * inert dead markup, confirmed by grep, omitted rather than replicated.
 */
@Component({
    selector: "tg-related-userstory-row",
    templateUrl: "./related-userstory-row.component.html",
})
export class RelatedUserstoryRowComponent implements OnChanges {
    @Input() userstory: any;
    @Input() epic: any;
    @Input() project: any;
    @Output() loadRelatedUserstories = new EventEmitter<void>();

    avatar: any;

    constructor(
        @Inject(AJS_AVATAR_SERVICE) private avatarService: any,
        @Inject(AJS_TRANSLATE) private translate: any,
        @Inject(AJS_CONFIRM) private confirm: any,
        @Inject(AJS_RESOURCES) private rs: any,
        @Inject(AJS_PROJECT_SERVICE) private projectService: any,
        @Inject(AJS_PROJECT_LOGO_SERVICE) private projectLogoService: any,
    ) {}

    ngOnChanges(): void {
        this.setAvatarData();
    }

    private setAvatarData(): void {
        const member = this.userstory.get("assigned_to_extra_info");

        this.avatar = this.avatarService.getAvatar(member);
    }

    getAssignedToFullNameDisplay(): string {
        if (this.userstory.get("assigned_to")) {
            return this.userstory.getIn(["assigned_to_extra_info", "full_name_display"]);
        }

        return this.translate.instant("COMMON.ASSIGNED_TO.NOT_ASSIGNED");
    }

    canEditEpics(): boolean {
        return this.projectService.project && this.projectService.canEdit("modify_epic");
    }

    getProjectLogoUrl(): string {
        const p = Immutable.fromJS(this.userstory.get("project_extra_info"));
        const logoSmallUrl = p.get("logo_small_url");

        if (logoSmallUrl) {
            return logoSmallUrl;
        }

        return this.projectLogoService.getDefaultProjectLogo(p.get("slug"), p.get("id")).src;
    }

    getProjectLogoBg(): string {
        const p = Immutable.fromJS(this.userstory.get("project_extra_info"));

        if (p.get("logo_small_url")) {
            return "";
        }

        return this.projectLogoService.getDefaultProjectLogo(p.get("slug"), p.get("id")).color;
    }

    onDeleteRelatedUserstory(): void {
        const title = this.translate.instant("LIGHTBOX.REMOVE_RELATIONSHIP_WITH_EPIC.TITLE");
        let message = this.translate.instant("LIGHTBOX.REMOVE_RELATIONSHIP_WITH_EPIC.MESSAGE", {
            epicSubject: this.epic.get("subject"),
        });

        this.confirm.ask(title, null, message).then((askResponse: any) => {
            const epicId = this.epic.get("id");
            const userstoryId = this.userstory.get("id");

            this.rs.epics.deleteRelatedUserstory(epicId, userstoryId).then(
                () => {
                    this.loadRelatedUserstories.emit();
                    askResponse.finish();
                },
                () => {
                    message = this.translate.instant("EPIC.ERROR_UNLINK_RELATED_USERSTORY", { errorMessage: message });
                    this.confirm.notify("error", null, message);
                    askResponse.finish(false);
                },
            );
        });
    }
}
