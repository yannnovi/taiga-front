import { Component, EventEmitter, Input, Output } from "@angular/core";

/**
 * Angular replacement for the AngularJS `tgBoardZoom` directive
 * (app/modules/components/board-zoom/), downgraded in place under the same name.
 * `tg-bind-scope` on each radio input in the original template is a pure debugging aid
 * (attaches the scope for jQuery inspection, app/coffee/modules/common/bind-scope.coffee)
 * with no functional effect - omitted, nothing to replicate.
 *
 * `value` was an AngularJS `=` (two-way) binding: the original directive itself never
 * *writes* it (the radios' own `ng-model` did, via the isolate scope sync), but its callers
 * (taskboard-zoom, kanban-board-zoom) watch it for changes. `@Output() valueChange` paired
 * with `@Input() value` is Angular's own two-way convention; downgradeComponent maps it to
 * the `bindon-value="..."` attribute for still-AngularJS callers (see MIGRATION.md).
 */
@Component({
    selector: "tg-board-zoom",
    templateUrl: "./board-zoom.component.html",
})
export class BoardZoomComponent {
    @Input() levels: any;
    @Input() value: any;
    @Output() valueChange = new EventEmitter<any>();

    select(zoomIndex: number): void {
        this.value = zoomIndex;
        this.valueChange.emit(this.value);
    }
}
