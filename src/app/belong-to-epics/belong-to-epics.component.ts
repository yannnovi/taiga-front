import { Component, Inject, Input, OnChanges, OnDestroy, OnInit } from "@angular/core";
import {
    AJS_CONFIRM,
    AJS_PROJECT_SERVICE,
    AJS_RESOURCES,
    AJS_ROOT_SCOPE,
    AJS_TG_RESOURCES,
    AJS_TRANSLATE,
} from "../shared/ajs-tokens";

declare const Immutable: any;

/**
 * Angular replacement for the AngularJS `tgBelongToEpics` directive
 * (app/modules/components/belong-to-epics/), downgraded in place under the same name -
 * shows the epic(s) a user story belongs to, in one of two visual formats. The original
 * picked between two templates via a dynamic `templateUrl` function based on the `format`
 * attribute (`"pill"` or `"text"`, defaulting to `"pill"`) - ported as one component with
 * both variants in one template, gated by `*ngIf`, rather than two separate downgraded
 * components, since it's genuinely one directive with one binding contract, not two
 * distinct AngularJS directives like `attachment`/`attachment-gallery` were.
 *
 * The `"pill"` template's `| darker:-0.2` filter (app/coffee/modules/common/filters.coffee)
 * replicated as a plain method - used nowhere else, not worth a shared pipe.
 *
 * The `"text"` template's `removeEpicRelationship` deletes via `tgResources.epics.deleteRelatedUserstory`
 * (the *smaller* resources aggregator - AJS_RESOURCES), then refetches the full user story
 * via `$tgResources.userstories.getByRef` (the *full* one - AJS_TG_RESOURCES) to refresh
 * the displayed epic list - same two-services distinction documented in ajs-tokens.ts.
 *
 * Important: the original's `related-epics:changed` scope event is not purely
 * self-referential housekeeping - `app/coffee/modules/common/lightboxes.coffee`'s
 * "relate to epic" lightbox also `$rootScope.$broadcast`s this same event after linking a
 * user story to a *new* epic from elsewhere in the UI. This component needs to react to
 * both: its own `removeEpicRelationship` refreshes directly (no event round-trip needed,
 * since there is no other listener for its own narrow-scope broadcast), and a
 * `$rootScope.$on` listener (cleaned up on destroy) catches the external one.
 */
@Component({
    selector: "tg-belong-to-epics",
    templateUrl: "./belong-to-epics.component.html",
})
export class BelongToEpicsComponent implements OnInit, OnChanges, OnDestroy {
    @Input() epics: any;
    @Input() item: any;
    @Input() format: string | undefined;

    immutableEpics: any = [];

    private unlisten: (() => void) | undefined;

    constructor(
        @Inject(AJS_TRANSLATE) private translate: any,
        @Inject(AJS_CONFIRM) private confirm: any,
        @Inject(AJS_TG_RESOURCES) private rs: any,
        @Inject(AJS_RESOURCES) private rs2: any,
        @Inject(AJS_ROOT_SCOPE) private rootScope: any,
        @Inject(AJS_PROJECT_SERVICE) private projectService: any,
    ) {}

    canEditUs(): boolean {
        return this.projectService.project && this.projectService.canEdit("modify_us");
    }

    ngOnInit(): void {
        this.unlisten = this.rootScope.$on("related-epics:changed", (_event: any, userStory: any) => {
            this.refetchAndUpdate(userStory.project, userStory.ref);
        });
    }

    ngOnChanges(): void {
        this.updateEpics(this.epics);
    }

    ngOnDestroy(): void {
        this.unlisten?.();
    }

    private updateEpics(epics: any): void {
        if (epics && !epics.isIterable) {
            this.immutableEpics = Immutable.fromJS(epics);
        } else {
            this.immutableEpics = [];
        }
    }

    darker(color: string, luminosity: number): string {
        if (!color) {
            return "transparent";
        }

        const cleaned = String(color).replace(/[^0-9a-f]/gi, "");
        const hex = cleaned.length < 6 ? cleaned[0] + cleaned[0] + cleaned[1] + cleaned[1] + cleaned[2] + cleaned[2] : cleaned;

        let newColor = "#";

        for (const i of [0, 1, 2]) {
            const c = parseInt(hex.substr(i * 2, 2), 16);
            const adjusted = Math.round(Math.min(Math.max(0, c + luminosity * 255), 255)).toString(16);

            newColor += ("00" + adjusted).substr(adjusted.length);
        }

        return newColor;
    }

    removeEpicRelationship(epic: any): void {
        const title = this.translate.instant("LIGHTBOX.REMOVE_RELATIONSHIP_WITH_EPIC.TITLE");
        const message = this.translate.instant("LIGHTBOX.REMOVE_RELATIONSHIP_WITH_EPIC.MESSAGE", {
            epicSubject: epic.get("subject"),
        });

        this.confirm.ask(title, null, message).then((askResponse: any) => {
            const epicId = epic.get("id");
            const usId = this.item.id;

            this.rs2.epics.deleteRelatedUserstory(epicId, usId).then(
                () => {
                    askResponse.finish();
                    this.refetchAndUpdate(this.item.project, this.item.ref);
                },
                () => {
                    askResponse.finish(false);
                    this.confirm.notify("error");
                },
            );
        });
    }

    private refetchAndUpdate(project: any, ref: any): void {
        this.rs.userstories.getByRef(project, ref, {}).then((us: any) => {
            this.item.epics = us.epics;
            this.updateEpics(us.epics);
        });
    }
}
