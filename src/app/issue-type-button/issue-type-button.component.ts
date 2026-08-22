import { Component, ElementRef, Input, OnChanges } from "@angular/core";

declare const $: any;

/**
 * Angular replacement for the AngularJS `tgIssueTypeButton` directive
 * (app/coffee/modules/issues/detail.coffee), downgraded in place under the same name.
 *
 * Only the `not-auto-save` behavior is ported: `tg-lb-create-edit` (this component's only
 * caller so far) always uses it that way, mutating `@Input() item` in place and leaving
 * the actual save to the form's own submit. The original's *other* mode (auto-save via
 * `$tgQueueModelTransformation`) is a shared, stateful service that only works once a page
 * controller has called `.setObject(scope, prop)` on it first (`issues/detail.coffee`'s
 * `IssueDetailController`, not part of this migration yet) - not ported here since nothing
 * exercises it yet; a future migration of the issue detail page itself should design that
 * coupling properly rather than inherit a guess at it.
 */
@Component({
    selector: "tg-issue-type-button",
    templateUrl: "./issue-type-button.component.html",
})
export class IssueTypeButtonComponent implements OnChanges {
    @Input() item: any;
    @Input() typeById: Record<string, any> = {};
    @Input() typeList: any[] = [];
    @Input() project: any;

    type: any;
    editable = false;

    constructor(private elementRef: ElementRef) {}

    ngOnChanges(): void {
        this.type = this.typeById[this.item?.type];
        this.editable = !this.project?.archived_code && this.project?.my_permissions?.indexOf("modify_issue") > -1;
    }

    openPopover(event: MouseEvent): void {
        event.preventDefault();
        event.stopPropagation();

        if (!this.editable) {
            return;
        }

        $(this.elementRef.nativeElement).find(".pop-type").popover().open();
    }

    save(typeId: any, event: MouseEvent): void {
        event.preventDefault();
        event.stopPropagation();

        if (!this.editable) {
            return;
        }

        $.fn.popover().closeAll();

        this.item.type = typeId;
        this.type = this.typeById[typeId];
    }
}
