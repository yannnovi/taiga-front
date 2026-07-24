import { Component, EventEmitter, Inject, Input, OnChanges, Output } from "@angular/core";
import { AJS_TRANSLATE } from "../shared/ajs-tokens";

/**
 * Angular replacement for the AngularJS `tgSwimlaneSelector` directive
 * (app/modules/components/swimlane-selector/), downgraded in place under the same name.
 *
 * The original used `require: "ngModel"` for its two-way output (the selected swimlane
 * id) - downgradeComponent has no equivalent for AngularJS's ngModel form-controller
 * integration, so this is exposed as a plain two-way `value`/`valueChange` pair instead
 * (Angular's own convention). Callers (still AngularJS) switch from `ng-model="..."` to
 * `bindon-value="..."` - see MIGRATION.md.
 */
@Component({
    selector: "tg-swimlane-selector",
    templateUrl: "./swimlane-selector.component.html",
})
export class SwimlaneSelectorComponent implements OnChanges {
    @Input() swimlanes: any;
    @Input() defaultSwimlaneId: any;
    @Input() userStory: any;
    @Input() hasUnclassifiedStories: any;
    @Input() value: any;
    @Output() valueChange = new EventEmitter<any>();

    displaySelector = false;
    selectedSwimlane: any = null;
    currentSwimlane: any = null;
    private hideTimeout: any = null;

    constructor(@Inject(AJS_TRANSLATE) private translate: any) {}

    ngOnChanges(): void {
        if (this.userStory && this.swimlanes) {
            this.getCurrentSwimlane();
        }
    }

    displayOptions(): void {
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
            this.hideTimeout = null;
        }

        this.displaySelector = true;
    }

    hideOptions(): void {
        this.hideTimeout = setTimeout(() => (this.displaySelector = false), 100);
    }

    selectSwimlane(swimlane: any): void {
        if (swimlane === "noSwimlane") {
            const unclassified = {
                id: null,
                kanban_order: 1,
                name: this.translate.instant("KANBAN.UNCLASSIFIED_USER_STORIES"),
            };
            this.value = unclassified.id;
            this.currentSwimlane = unclassified;
        } else {
            this.value = swimlane.id !== -1 ? swimlane.id : null;
            this.currentSwimlane = swimlane;
        }

        this.hideOptions();
        this.valueChange.emit(this.value);
        this.getSelectedSwimlane();
    }

    private getCurrentSwimlane(): void {
        if (this.userStory.id) {
            if (this.userStory.swimlane) {
                this.currentSwimlane = this.swimlanes
                    .filter((swimlane: any) => swimlane.id === this.userStory.swimlane)
                    .get(0);
            } else {
                this.currentSwimlane = null;
            }
        } else {
            this.currentSwimlane = this.swimlanes
                .filter((swimlane: any) => swimlane.id === this.defaultSwimlaneId)
                .get(0);
        }

        this.getSelectedSwimlane();
    }

    private getSelectedSwimlane(): void {
        if (this.userStory.id) {
            this.selectedSwimlane = this.currentSwimlane ? this.currentSwimlane.id : null;
        } else {
            this.selectedSwimlane = this.currentSwimlane.id;
        }
    }
}
