import { Component, EventEmitter, Inject, Input, OnChanges, OnInit, Output } from "@angular/core";
import { AJS_PROJECT_SERVICE } from "../shared/ajs-tokens";

declare const taiga: any;
declare const _: any;

/**
 * Angular replacement for the AngularJS `tgColorSelector` directive
 * (app/modules/components/color-selector/), downgraded in place under the same name.
 *
 * The original bound jQuery `mouseenter`/`mouseleave` separately on `.color-selector` and
 * `.color-selector-dropdown` to cancel/schedule closing the dropdown. Both elements sit
 * inside the same outer wrapper here, and `mouseenter`/`mouseleave` don't bubble, so a
 * single pair of handlers on that wrapper covers "hovering the trigger or the panel keeps
 * it open" the same way, more simply.
 *
 * `ng-title="color"` in the original template (on each color swatch) isn't a real
 * AngularJS directive/attribute - a no-op, same category as other dead markup found
 * elsewhere (discover-search-list-header's `toggleClose`, etc.) - omitted.
 *
 * `@Output()` named `selectColor`, not `onSelectColor` (the original binding's name) -
 * downgradeComponent derives the attribute name by prefixing "on" onto the property name,
 * so `onSelectColor` would need an `on-on-select-color` attribute and never match the
 * existing `on-select-color` callers. Same gotcha as taskboard-zoom/kanban-board-zoom.
 */
@Component({
    selector: "tg-color-selector",
    templateUrl: "./color-selector.component.html",
})
export class ColorSelectorComponent implements OnInit, OnChanges {
    @Input() isColorRequired: any;
    @Input() initColor: any;
    @Input() requiredPerm: any;
    @Output() selectColor = new EventEmitter<{ color: string | null }>();

    colorList: string[] = [];
    displayColorList = false;
    color: string | null = null;
    customColor: string | null = null;

    private closeTimeout: any = null;

    constructor(@Inject(AJS_PROJECT_SERVICE) private projectService: any) {}

    ngOnInit(): void {
        this.colorList = taiga.getDefaulColorList();

        if (!this.isColorRequired) {
            this.colorList = _.dropRight(this.colorList);
        }
    }

    ngOnChanges(): void {
        this.setColor(this.initColor);
    }

    userCanChangeColor(): boolean {
        if (!this.requiredPerm) {
            return true;
        }

        return this.projectService.hasPermission(this.requiredPerm);
    }

    setColor(color: string | null): void {
        this.color = color;
        this.customColor = color;
    }

    resetColor(): void {
        if (this.isColorRequired && !this.color) {
            this.color = this.initColor;
        }
    }

    toggleColorList(): void {
        this.displayColorList = !this.displayColorList;
        this.customColor = this.color;
        this.resetColor();
    }

    onSelectDropdownColor(color: string | null): void {
        this.color = color;
        this.selectColor.emit({ color });
        this.toggleColorList();
    }

    onKeyDown(event: KeyboardEvent): void {
        if (event.which === 13 || event.keyCode === 13) {
            if (this.customColor || !this.isColorRequired) {
                this.onSelectDropdownColor(this.customColor);
            }

            event.preventDefault();
        }
    }

    cancelClose(): void {
        clearTimeout(this.closeTimeout);
        this.closeTimeout = null;
    }

    scheduleClose(): void {
        if (this.closeTimeout) {
            return;
        }

        this.closeTimeout = setTimeout(() => {
            this.displayColorList = false;
            this.resetColor();
        }, 400);
    }
}
