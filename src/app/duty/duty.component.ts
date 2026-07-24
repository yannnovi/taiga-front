import { Component, Inject, Input } from "@angular/core";
import { AJS_AVATAR_SERVICE, AJS_PROJECT_LOGO_SERVICE, AJS_ROOT_SCOPE, AJS_TRANSLATE } from "../shared/ajs-tokens";

declare const window: any;
declare const Immutable: any;

/**
 * Angular replacement for the AngularJS `tgDuty` directive
 * (app/modules/home/duties/), downgraded in place under the same name - a single
 * ticket row in the home page's "working on"/"watching" lists (the parent `tg-working-on`
 * directive stays AngularJS, wrapped via `TgWorkingOnUpgradedDirective` since it uses
 * transclude/require coupling elsewhere - not touched here, only its 4 `tg-duty` usages
 * switch from attribute form (`tg-duty="duty"`) to element form (`downgradeComponent`
 * always compiles as `restrict: 'E'`), so the caller markup itself needed restructuring,
 * not just an attribute rename.
 *
 * `tg-avatar`/`tg-project-logo-small-src` (template-less) replicated inline. `tg-bo-ref`
 * (template-less bind-once helper, app/coffee/modules/base/bind.coffee) replicated as a
 * plain interpolation - Angular's change detection makes the "bind once" optimization
 * unnecessary. The original emitted `duty:toggle-hidden` via `$scope.$emit` (bubbling up
 * to the parent `tg-working-on` scope's `$on` listener) - since a plain Angular component
 * has no AngularJS `$scope` to emit upward from, replicated via
 * `$rootScope.$broadcast` instead (same event name, `$on` doesn't distinguish emit vs
 * broadcast, only direction - the original's requirement was reaching that one specific
 * ancestor listener, which broadcast still does).
 */
@Component({
    selector: "tg-duty",
    templateUrl: "./duty.component.html",
})
export class DutyComponent {
    @Input() duty: any;
    @Input() isHidden: any;
    @Input() type: any;

    constructor(
        @Inject(AJS_TRANSLATE) private translate: any,
        @Inject(AJS_AVATAR_SERVICE) private avatarService: any,
        @Inject(AJS_ROOT_SCOPE) private rootScope: any,
        @Inject(AJS_PROJECT_LOGO_SERVICE) private projectLogoService: any,
    ) {}

    unassignedImageSrc = `${window._version}/images/unnamed.png`;

    getAvatarUrl(): string {
        return this.avatarService.getAvatar(this.duty.get("assigned_to_extra_info")).url;
    }

    getProjectLogoUrl(): string {
        const project = Immutable.fromJS(this.duty.get("project"));
        const logoSmallUrl = project.get("logo_small_url");

        if (logoSmallUrl) {
            return logoSmallUrl;
        }

        return this.projectLogoService.getDefaultProjectLogo(project.get("slug"), project.get("id")).src;
    }

    getProjectLogoBg(): string {
        const project = Immutable.fromJS(this.duty.get("project"));

        if (project.get("logo_small_url")) {
            return "";
        }

        return this.projectLogoService.getDefaultProjectLogo(project.get("slug"), project.get("id")).color;
    }

    getDutyType(): string | undefined {
        if (!this.duty) {
            return undefined;
        }

        switch (this.duty.get("_name")) {
            case "epics":
                return this.translate.instant("COMMON.EPIC");
            case "userstories":
                return this.translate.instant("COMMON.USER_STORY");
            case "tasks":
                return this.translate.instant("COMMON.TASK");
            case "issues":
                return this.translate.instant("COMMON.ISSUE");
            default:
                return undefined;
        }
    }

    toggleHidden(): void {
        this.rootScope.$broadcast("duty:toggle-hidden", this.duty, this.type);
    }
}
