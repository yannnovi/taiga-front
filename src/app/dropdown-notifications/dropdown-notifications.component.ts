import { Component, Inject, Input, OnDestroy, OnInit } from "@angular/core";
import { AJS_NOTIFICATIONS_SERVICE, AJS_ROOT_SCOPE } from "../shared/ajs-tokens";

/**
 * Angular replacement for the AngularJS `tgDropdownNotifications` directive
 * (app/modules/navigation-bar/dropdown-notifications/), downgraded in place under the
 * same name. Previously rejected for using `tg-nav` in its own template - now unblocked.
 *
 * Uses the already-migrated `tg-notifications-list` upgraded-directive wrapper
 * (src/app/upgraded/tg-notifications-list.upgraded-directive.ts) natively - it already
 * exposes exactly the three inputs this template needs (onlyUnread,
 * infiniteScrollContainer, infiniteScrollDisabled).
 *
 * Event wiring caveat: the original listened on its own isolate `$scope` for
 * "notifications:loading"/"notifications:loaded", bubbled up from the nested
 * `tg-notifications-list`'s own separate "Notifications" AngularJS controller instance
 * (`@scope.$emit(...)` on *that* controller's own scope, a child of this directive's
 * scope in the AngularJS scope tree - see notifications.component.ts's docstring for why
 * that controller instance exists independently). A plain Angular component has no
 * equivalent local `$scope` to listen on, and there's genuine uncertainty about how
 * `UpgradeComponent`-wrapped children's scope hierarchy resolves when nested inside a
 * *downgraded* component's template (a hybrid boundary this migration hasn't had to cross
 * before). Implemented here via `$rootScope.$on(...)` as the closest practical
 * approximation - this could NOT be verified interactively in this environment (needs
 * real notification data from a live backend), so treat the loading spinner/counter
 * flash as unverified pending a real test.
 */
@Component({
    selector: "tg-dropdown-notifications",
    templateUrl: "./dropdown-notifications.component.html",
})
export class DropdownNotificationsComponent implements OnInit, OnDestroy {
    @Input() active: any;

    visible = false;
    loading = false;
    total: number | undefined;
    newEvent = false;

    private unlisten: Array<() => void> = [];

    constructor(
        @Inject(AJS_ROOT_SCOPE) private rootScope: any,
        @Inject(AJS_NOTIFICATIONS_SERVICE) private notificationsService: any,
    ) {}

    ngOnInit(): void {
        this.unlisten.push(
            this.rootScope.$on("notifications:loaded", (_event: any, total: number) => {
                this.loading = false;

                if (this.total !== undefined && total > this.total) {
                    this.newEvent = true;

                    setTimeout(() => {
                        this.total = total;
                    }, 100);
                    setTimeout(() => {
                        this.newEvent = false;
                    }, 2000);
                } else {
                    this.total = total;
                }
            }),
        );

        this.unlisten.push(
            this.rootScope.$on("notifications:loading", () => {
                this.loading = true;
            }),
        );
    }

    ngOnDestroy(): void {
        this.unlisten.forEach((fn) => fn());
    }

    setAllAsRead(): void {
        this.notificationsService.setNotificationsAsRead().then(() => {
            this.rootScope.$emit("notifications:dismiss-all");
        });
    }
}
