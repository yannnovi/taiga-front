import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";

/**
 * Angular replacement for the AngularJS `tgDiscoverSearchListHeader` directive
 * (app/modules/discover/components/discover-search-list-header/). Downgraded in
 * register-legacy.ts under the same directive name. Its still-AngularJS caller
 * (discover-search.jade) needed the same call-syntax adjustment as
 * discover-home-order-by (see MIGRATION.md): `bind-order-by` for the input, `$event` in
 * the `on-change` expression, and the `@Output()` named `change` (not `onChange`).
 *
 * Note: the original AngularJS template had `ng-mouseleave="vm.toggleClose()"` on the
 * outer element, but `toggleClose` was never actually defined on the controller - calling
 * an undefined method in an AngularJS expression is a silent no-op. Replicated faithfully
 * here by simply not wiring anything to (mouseleave), rather than "fixing" behavior that
 * was never really there.
 */
@Component({
    selector: "tg-discover-search-list-header",
    templateUrl: "./discover-search-list-header.component.html",
})
export class DiscoverSearchListHeaderComponent implements OnInit {
    @Input() orderBy!: string;
    @Output() change = new EventEmitter<{ orderBy: string }>();

    likeIsOpen = false;
    activityIsOpen = false;

    ngOnInit(): void {
        this.likeIsOpen = this.orderBy.indexOf("-total_fans") === 0;
        this.activityIsOpen = this.orderBy.indexOf("-total_activity") === 0;
    }

    openLike(): void {
        this.likeIsOpen = true;
        this.activityIsOpen = false;
        this.setOrderBy("-total_fans_last_week");
    }

    openActivity(): void {
        this.activityIsOpen = true;
        this.likeIsOpen = false;
        this.setOrderBy("-total_activity_last_week");
    }

    setOrderBy(type = ""): void {
        if (!type) {
            this.likeIsOpen = false;
            this.activityIsOpen = false;
        }

        // Faithful to the original: this component doesn't update its own `orderBy`
        // locally - the AngularJS caller (discover-search.controller.coffee) does, in its
        // onChangeOrder handler, and that flows back down through the one-way
        // `bind-order-by` watch (see MIGRATION.md).
        this.change.emit({ orderBy: type });
    }
}
