import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from "@angular/core";

/**
 * Angular replacement for the AngularJS `tgInputSearch` component
 * (app/modules/components/input-search/, already using the newer `.component()` API -
 * the only file in the whole codebase that did). Downgraded in place under the same name.
 * Callers (backlog.jade, taskboard.jade, issues.jade, kanban.jade) updated:
 * `q="ctrl.filterQ"` -> `bind-q="ctrl.filterQ"`, `change="ctrl.changeQ(q)"` ->
 * `on-change="ctrl.changeQ($event.q)"` (the `change` property itself keeps its name,
 * unlike `onChange` cases elsewhere - downgradeComponent derives the `on-change` attribute
 * from the property name by prefixing "on", so a property already named `change` needs no
 * renaming).
 */
@Component({
    selector: "tg-input-search",
    templateUrl: "./input-search.component.html",
})
export class InputSearchComponent implements OnChanges {
    @Input() q: any;
    @Output() change = new EventEmitter<{ q: string }>();

    searchText = "";
    private dirty = false;

    ngOnChanges(changes: SimpleChanges): void {
        if (changes["q"] && !this.dirty) {
            this.searchText = this.q;
        }
    }

    onChange(text: string): void {
        this.dirty = true;
        this.change.emit({ q: text });
    }
}
