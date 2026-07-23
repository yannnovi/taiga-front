import { Component, Inject, OnDestroy } from "@angular/core";
import {
    AJS_CURRENT_USER_SERVICE,
    AJS_LOCATION,
    AJS_NOTIFICATIONS_SERVICE,
    AJS_ROOT_SCOPE,
    AJS_WINDOW,
} from "../shared/ajs-tokens";

declare const Immutable: any;

/**
 * Angular replacement for the old AngularJS `Notifications` route controller
 * (app/modules/notifications/notifications.controller.coffee + .jade). Downgraded as
 * `<tg-notifications>` for the "/notifications" ngRoute route.
 *
 * `NotificationsController` extended `mixOf(taiga.Controller, taiga.PageMixin,
 * taiga.FiltersMixin)`, but this controller's own body never calls any of those mixins'
 * methods (`fillUsersAndRoles`, `selectFilter`, etc.) - they're dead weight for this
 * particular controller, so nothing is lost by not replicating them here.
 *
 * The `tg-notifications-list` child directive (app/modules/notifications/notifications-list/)
 * *also* instantiates its own separate `Notifications` controller instance internally
 * (own isolate scope, own templateUrl) - that's pre-existing, unrelated architecture, left
 * untouched and wrapped via UpgradeComponent. The two instances stay in sync only through
 * the `notifications:*` $rootScope events, exactly as before.
 */
@Component({
    selector: "tg-notifications",
    templateUrl: "./notifications.component.html",
})
export class NotificationsComponent implements OnDestroy {
    total = 0;
    user: any;
    scrollDisabled = false;
    onlyUnread: boolean | undefined;
    notificationsList: any;
    list: any;
    loading = false;

    private unlisten: Array<() => void> = [];

    constructor(
        @Inject(AJS_ROOT_SCOPE) private rootScope: any,
        @Inject(AJS_NOTIFICATIONS_SERVICE) private notificationsService: any,
        @Inject(AJS_CURRENT_USER_SERVICE) currentUserService: any,
        @Inject(AJS_LOCATION) private location: any,
        @Inject(AJS_WINDOW) private window: any,
    ) {
        this.user = currentUserService.getUser();
        this.initList();
        this.loadNotifications();

        this.unlisten.push(
            this.rootScope.$on("notifications:dismiss", () => {
                if (this.onlyUnread) {
                    this.reloadList();
                }
            }),
        );
        this.unlisten.push(this.rootScope.$on("notifications:new", () => this.reloadList()));
        this.unlisten.push(this.rootScope.$on("notifications:dismiss-all", () => this.reloadList()));
    }

    ngOnDestroy(): void {
        this.unlisten.forEach((fn) => fn());
    }

    initList(): void {
        this.notificationsList = Immutable.List();

        if (this.user) {
            this.list = this.notificationsService.getNotificationsList(this.user.get("id"), !!this.onlyUnread);
        }

        this.loading = !this.list;
    }

    reloadList(): void {
        this.initList();
        this.loadNotifications();
    }

    loadNotifications(): any {
        this.scrollDisabled = true;
        this.loading = true;
        this.rootScope.$emit("notifications:loading");

        return this.list.next().then((response: any) => {
            this.notificationsList = this.notificationsList.concat(response.get("items"));

            if (response.get("next")) {
                this.scrollDisabled = false;
            }

            this.total = response.get("total");
            this.rootScope.$emit("notifications:loaded", this.total);
            this.loading = false;

            return this.notificationsList;
        });
    }

    setAsRead(notification: any, url: string): void {
        this.notificationsService.setNotificationAsRead(notification.get("id")).then(() => {
            if (this.location.$$url === url) {
                this.window.location.reload();
            } else {
                this.location.path(url);
            }

            this.rootScope.$broadcast("notifications:dismiss");
        });
    }

    setAllAsRead(): void {
        this.notificationsService.setNotificationsAsRead().then(() => {
            this.rootScope.$broadcast("notifications:dismiss-all");
        });
    }
}
