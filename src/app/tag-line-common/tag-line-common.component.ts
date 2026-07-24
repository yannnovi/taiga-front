import {
    Component,
    ElementRef,
    EventEmitter,
    Inject,
    Input,
    OnChanges,
    Output,
    ViewChild,
} from "@angular/core";
import { AJS_TAG_LINE_SERVICE } from "../shared/ajs-tokens";
import { TagDropdownComponent } from "../tag-dropdown/tag-dropdown.component";

/**
 * Angular replacement for the AngularJS `tgTagLineCommon` directive
 * (app/modules/components/tags/tag-line-common/), downgraded in place under the same
 * name. Inlines the two Jade `include`s the original template used
 * (components/add-tag-button, components/add-tag-input) since Jade includes are a
 * compile-time template composition mechanism with no Angular equivalent - there was
 * nothing left to "call" at runtime, so their markup is just part of this component's own
 * template now.
 *
 * `tg-autofocus` (template-less, focuses an element once via `$timeout`) is replicated via
 * a plain `setTimeout` + `ViewChild` focus call, triggered the same moment the original
 * did: right when the "add tag" input becomes visible. `tg-loading` (template-less,
 * swaps content for a spinner) is replicated as a disabled/opacity state instead of a full
 * content swap - same idea as elsewhere in this migration, different presentation, same
 * end-user signal (a save in progress).
 *
 * Keyboard handling: the original had two separate keydown listeners - one in this
 * directive's own `link` (on `.tag-input`, handling Escape/Enter) and one inside
 * `tgTagsDropdown` itself (attached to *this* directive's root element, i.e. the shared
 * parent container, handling ArrowUp/ArrowDown by walking `.selected` via jQuery). Both are
 * merged into this component's single `onTagInputKeydown` handler, delegating
 * arrow-key selection to the nested `TagDropdownComponent` via `@ViewChild` instead of
 * manipulating a CSS class through the DOM directly.
 *
 * The original template had two `.tag-wrapper` blocks with the same `ng-repeat`, gated by
 * `ng-if="tag[1] && !disableColorSelection"` and `ng-if="!tag[1] || disableColorSelection"`
 * respectively - two logical complements, so every tag matches exactly one, and both
 * blocks rendered the exact same `tg-tag` markup. Simplified to a single `*ngFor` with no
 * condition, since the split had no observable effect either way.
 */
@Component({
    selector: "tg-tag-line-common",
    templateUrl: "./tag-line-common.component.html",
})
export class TagLineCommonComponent implements OnChanges {
    @Input() permissions: string | undefined;
    @Input() loadingAddTag: any;
    @Input() loadingRemoveTag: any;
    @Input() tags: any;
    @Input() project: any;
    @Input() disableColorSelection = false;
    @Output() addTag = new EventEmitter<{ name: string; color: string | null }>();
    @Output() deleteTag = new EventEmitter<{ tag: any }>();

    @ViewChild("tagInput") tagInputRef: ElementRef<HTMLInputElement> | undefined;
    @ViewChild(TagDropdownComponent) tagDropdown: TagDropdownComponent | undefined;

    newTag: { name: string; color: string | null } = { name: "", color: null };
    colorArray: [string, string][] = [];
    isAddingTag = false;

    private colorArrayInitialized = false;

    constructor(@Inject(AJS_TAG_LINE_SERVICE) private tagLineService: any) {}

    ngOnChanges(): void {
        if (this.colorArrayInitialized || !this.project || !Object.keys(this.project).length) {
            return;
        }

        if (!this.disableColorSelection) {
            this.colorArrayInitialized = true;
            this.colorArray = this.tagLineService.createColorsArray(this.project.tags_colors);
        }
    }

    checkPermissions(): boolean {
        return this.tagLineService.checkPermissions(this.project.my_permissions, this.permissions);
    }

    isArchived(): boolean {
        return this.project.archived_code;
    }

    displayTagInput(): void {
        this.isAddingTag = true;

        setTimeout(() => this.tagInputRef?.nativeElement.focus());
    }

    addNewTag(name: string, color: string | null): void {
        this.newTag.name = "";
        this.newTag.color = null;

        if (!name.length) {
            return;
        }

        if (this.disableColorSelection) {
            this.addTag.emit({ name, color });
        } else {
            if (this.project.tags_colors[name]) {
                color = this.project.tags_colors[name];
            }

            this.addTag.emit({ name, color });
        }
    }

    selectColor(color: string | null): void {
        this.newTag.color = color;
    }

    onTagInputKeydown(event: KeyboardEvent): void {
        if (event.key === "Escape") {
            this.isAddingTag = false;
            this.newTag.name = "";
            this.newTag.color = null;
            event.stopPropagation();
        } else if (event.key === "Enter") {
            event.preventDefault();

            const selectedTagName = this.tagDropdown?.selectedTagName;

            if (selectedTagName) {
                this.addNewTag(selectedTagName, null);
            } else {
                this.addNewTag(this.newTag.name, this.newTag.color);
            }
        } else if (event.key === "ArrowDown") {
            event.preventDefault();
            this.tagDropdown?.moveSelection(1);
        } else if (event.key === "ArrowUp") {
            event.preventDefault();
            this.tagDropdown?.moveSelection(-1);
        }
    }
}
