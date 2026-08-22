import { Component, ElementRef, Input, OnChanges } from "@angular/core";

declare const $: any;

/**
 * Angular replacement for the AngularJS `tgIssueSeverityButton` directive
 * (app/coffee/modules/issues/detail.coffee), downgraded in place under the same name.
 * See `IssueTypeButtonComponent`'s doc comment - same not-auto-save-only scope decision.
 */
@Component({
    selector: "tg-issue-severity-button",
    templateUrl: "./issue-severity-button.component.html",
})
export class IssueSeverityButtonComponent implements OnChanges {
    @Input() item: any;
    @Input() severityById: Record<string, any> = {};
    @Input() severityList: any[] = [];
    @Input() project: any;

    severity: any;
    editable = false;

    constructor(private elementRef: ElementRef) {}

    ngOnChanges(): void {
        this.severity = this.severityById[this.item?.severity];
        this.editable = !this.project?.archived_code && this.project?.my_permissions?.indexOf("modify_issue") > -1;
    }

    openPopover(event: MouseEvent): void {
        event.preventDefault();
        event.stopPropagation();

        if (!this.editable) {
            return;
        }

        $(this.elementRef.nativeElement).find(".pop-severity").popover().open();
    }

    save(severityId: any, event: MouseEvent): void {
        event.preventDefault();
        event.stopPropagation();

        if (!this.editable) {
            return;
        }

        $.fn.popover().closeAll();

        this.item.severity = severityId;
        this.severity = this.severityById[severityId];
    }
}
