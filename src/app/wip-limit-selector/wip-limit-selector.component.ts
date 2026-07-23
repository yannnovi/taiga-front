import { Component, ElementRef, Inject, Input, OnInit, ViewChild } from "@angular/core";
import { AJS_RESOURCES, AJS_ROOT_SCOPE } from "../shared/ajs-tokens";

/**
 * Angular replacement for the AngularJS `tgWipLimitSelector` directive
 * (app/modules/components/wip-limit-selector/), downgraded in place under the same
 * directive name. The original split its state between the directive's own `$scope`
 * (`displayWipLimitSelector`, `toggleWipSelectorVisibility`) and a separate
 * `ProjectSwimlanesWipLimit` controller (`status`, `new_wip_limit`,
 * `submitSwimlaneNewStatus`) - both are just plain component state/methods here, no
 * functional difference from unifying them into one class.
 *
 * Bug fixed while porting: the original controller injected `"$tgResources"`, which is
 * not a registered AngularJS service anywhere in this codebase (only the unprefixed
 * `tgResources` is, in app/modules/resources/resources.coffee) - injecting it would have
 * thrown "Unknown provider" the moment this controller was instantiated. Used the real
 * `tgResources` service name here instead; replicating the broken name faithfully would
 * just mean this component never works at all.
 *
 * `tg-autofocus` (app/coffee/modules/common.coffee) is a plain attribute directive with no
 * template - like tg-avatar, not an UpgradeComponent fit - so its one relevant behavior
 * (focus the input a tick after it appears) is replicated directly via ViewChild/setTimeout.
 * `ng-value="statusWipLimit"` in the original template referenced a variable that was never
 * defined anywhere (dead markup, same category as discover-search-list-header's
 * `toggleClose` and live-announcement's `ng-title`) - omitted here, no behavior lost.
 */
@Component({
    selector: "tg-wip-limit-selector",
    templateUrl: "./wip-limit-selector.component.html",
})
export class WipLimitSelectorComponent implements OnInit {
    @Input() status: any;
    @ViewChild("wipLimitInput") wipLimitInput?: ElementRef<HTMLInputElement>;

    displayWipLimitSelector = false;
    newWipLimit: number | undefined;

    constructor(
        @Inject(AJS_ROOT_SCOPE) private rootScope: any,
        @Inject(AJS_RESOURCES) private rs: any,
    ) {}

    ngOnInit(): void {
        this.newWipLimit = this.status.wip_limit;
    }

    toggleWipSelectorVisibility(): void {
        this.displayWipLimitSelector = !this.displayWipLimitSelector;

        if (this.displayWipLimitSelector) {
            setTimeout(() => this.wipLimitInput?.nativeElement.focus());
        }
    }

    submitSwimlaneNewStatus(): Promise<any> {
        this.displayWipLimitSelector = false;

        if (this.status.swimlane_userstory_status_id) {
            return this.rs.swimlanes
                .wipLimitUpdate(this.status.swimlane_userstory_status_id, this.newWipLimit)
                .then(() => this.rootScope.$broadcast("swimlane:load"));
        }

        return this.rs.userstories
            .editStatus(this.status.id, this.newWipLimit)
            .then(() => this.rootScope.$broadcast("project:load"));
    }
}
