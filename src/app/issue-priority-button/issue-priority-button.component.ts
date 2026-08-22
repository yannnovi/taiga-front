import { Component, ElementRef, Input, OnChanges } from "@angular/core";

declare const $: any;

/**
 * Angular replacement for the AngularJS `tgIssuePriorityButton` directive
 * (app/coffee/modules/issues/detail.coffee), downgraded in place under the same name.
 * See `IssueTypeButtonComponent`'s doc comment - same not-auto-save-only scope decision.
 */
@Component({
    selector: "tg-issue-priority-button",
    templateUrl: "./issue-priority-button.component.html",
})
export class IssuePriorityButtonComponent implements OnChanges {
    @Input() item: any;
    @Input() priorityById: Record<string, any> = {};
    @Input() priorityList: any[] = [];
    @Input() project: any;

    priority: any;
    editable = false;

    constructor(private elementRef: ElementRef) {}

    ngOnChanges(): void {
        this.priority = this.priorityById[this.item?.priority];
        this.editable = !this.project?.archived_code && this.project?.my_permissions?.indexOf("modify_issue") > -1;
    }

    openPopover(event: MouseEvent): void {
        event.preventDefault();
        event.stopPropagation();

        if (!this.editable) {
            return;
        }

        $(this.elementRef.nativeElement).find(".pop-priority").popover().open();
    }

    save(priorityId: any, event: MouseEvent): void {
        event.preventDefault();
        event.stopPropagation();

        if (!this.editable) {
            return;
        }

        $.fn.popover().closeAll();

        this.item.priority = priorityId;
        this.priority = this.priorityById[priorityId];
    }
}
