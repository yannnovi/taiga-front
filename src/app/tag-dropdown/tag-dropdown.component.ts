import { Component, EventEmitter, Input, Output } from "@angular/core";

/**
 * Angular replacement for the AngularJS `tgTagsDropdown` directive
 * (app/modules/components/tags/tag-dropdown/), downgraded in place under the same name -
 * the tag-name/color autocomplete dropdown shown while typing a new tag.
 *
 * The original filtered with `colorArray | filter:tag.name:strict` - `strict` was never a
 * declared scope property (not in the isolate scope, not a global), so it always evaluated
 * to `undefined`/falsy: AngularJS's `filter` filter never actually ran in strict mode, only
 * its default substring/case-insensitive mode. Replicated as a plain case-insensitive
 * substring match against either element of each `[name, color]` pair.
 *
 * The original's keyboard up/down navigation (`.selected` class, walked via jQuery from a
 * keydown listener on the *parent* element) is replicated as component-owned
 * `selectedIndex` state instead of raw DOM class manipulation - `moveSelection`/
 * `selectedTag` are called from `TagLineCommonComponent`'s own input keydown handler via
 * `@ViewChild`, since the original's keydown listener lived on the shared parent
 * `.add-tag-input` container (catching bubbled keydown from the sibling `<input>`), not on
 * the dropdown itself.
 *
 * `@Output() selectTag` (not `onSelectTag`) so the existing `on-select-tag` attribute on
 * the one caller (add-tag-input, inlined into tag-line-common) keeps matching.
 */
@Component({
    selector: "tg-tags-dropdown",
    templateUrl: "./tag-dropdown.component.html",
})
export class TagDropdownComponent {
    @Input() colorArray: [string, string][] = [];
    @Input() tag: { name: string; color: string | null } = { name: "", color: null };
    @Output() selectTag = new EventEmitter<{ name: string; color: string | null }>();

    selectedIndex = -1;

    get filteredColorArray(): [string, string][] {
        const query = (this.tag?.name || "").toLowerCase();

        if (!query) {
            return this.colorArray;
        }

        return this.colorArray.filter((pair) => pair.some((value) => value != null && value.toLowerCase().includes(query)));
    }

    onSelectTag(pair: [string, string]): void {
        this.selectTag.emit({ name: pair[0], color: pair[1] });
    }

    moveSelection(direction: 1 | -1): void {
        const length = this.filteredColorArray.length;

        if (!length) {
            return;
        }

        if (this.selectedIndex === -1) {
            this.selectedIndex = direction === 1 ? 0 : length - 1;
        } else {
            const next = this.selectedIndex + direction;

            if (next >= 0 && next < length) {
                this.selectedIndex = next;
            }
        }
    }

    get selectedTagName(): string | null {
        const selected = this.filteredColorArray[this.selectedIndex];

        return selected ? selected[0] : null;
    }
}
