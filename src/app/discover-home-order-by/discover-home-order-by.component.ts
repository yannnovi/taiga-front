import { Component, EventEmitter, Inject, Input, OnInit, Output } from "@angular/core";
import { AJS_TRANSLATE } from "../shared/ajs-tokens";

/**
 * Angular replacement for the AngularJS `tgDiscoverHomeOrderBy` directive
 * (app/modules/discover/components/discover-home-order-by/). Downgraded in
 * register-legacy.ts under the same directive name. Its still-AngularJS callers
 * (most-liked.jade, most-active.jade) needed a small syntax adjustment to call a
 * downgraded component correctly - see MIGRATION.md ("Appeler un composant downgradé
 * depuis un template AngularJS non migré"): `bind-order-by` instead of plain `order-by`
 * for the input, `on-change="vm.orderBy($event.orderBy)"` for the output (downgraded
 * outputs always pass their payload as a single `$event` local, unlike AngularJS's `&`
 * bindings which support arbitrary named locals). The output property is named `change`
 * (not `onChange`) so downgradeComponent's auto-derived attribute name matches the
 * existing `on-change` attribute exactly.
 */
@Component({
    selector: "tg-discover-home-order-by",
    templateUrl: "./discover-home-order-by.component.html",
})
export class DiscoverHomeOrderByComponent implements OnInit {
    @Input() orderBy!: string;
    @Output() change = new EventEmitter<{ orderBy: string }>();

    isOpen = false;
    texts: Record<string, string> = {};

    constructor(@Inject(AJS_TRANSLATE) private translate: any) {}

    ngOnInit(): void {
        this.texts = {
            week: this.translate.instant("DISCOVER.FILTERS.WEEK"),
            month: this.translate.instant("DISCOVER.FILTERS.MONTH"),
            year: this.translate.instant("DISCOVER.FILTERS.YEAR"),
            all: this.translate.instant("DISCOVER.FILTERS.ALL_TIME"),
        };
    }

    currentText(): string {
        return this.texts[this.orderBy];
    }

    open(): void {
        this.isOpen = true;
    }

    close(): void {
        this.isOpen = false;
    }

    setOrderBy(type: string): void {
        this.orderBy = type;
        this.isOpen = false;
        this.change.emit({ orderBy: this.orderBy });
    }
}
