import { DoBootstrap, NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { UpgradeModule } from "@angular/upgrade/static";
import { FormsModule } from "@angular/forms";

import { HomeComponent } from "./home/home.component";
import "./home/register-legacy";
import { DiscoverHomeComponent } from "./discover-home/discover-home.component";
import "./discover-home/register-legacy";
import { DiscoverHomeOrderByComponent } from "./discover-home-order-by/discover-home-order-by.component";
import "./discover-home-order-by/register-legacy";
import { DiscoverSearchListHeaderComponent } from "./discover-search-list-header/discover-search-list-header.component";
import "./discover-search-list-header/register-legacy";
import { NotificationsComponent } from "./notifications/notifications.component";
import "./notifications/register-legacy";
import { ExternalAppComponent } from "./external-app/external-app.component";
import "./external-app/register-legacy";
import { ProfileHintsComponent } from "./profile-hints/profile-hints.component";
import "./profile-hints/register-legacy";
import { ProjectArchivedWarningComponent } from "./project-archived-warning/project-archived-warning.component";
import "./project-archived-warning/register-legacy";
import { TribeButtonComponent } from "./tribe-button/tribe-button.component";
import "./tribe-button/register-legacy";
import { LiveAnnouncementComponent } from "./live-announcement/live-announcement.component";
import "./live-announcement/register-legacy";
import { VoteButtonComponent } from "./vote-button/vote-button.component";
import "./vote-button/register-legacy";
import { WipLimitSelectorComponent } from "./wip-limit-selector/wip-limit-selector.component";
import "./wip-limit-selector/register-legacy";
import { InputSearchComponent } from "./input-search/input-search.component";
import "./input-search/register-legacy";
import { BoardZoomComponent } from "./board-zoom/board-zoom.component";
import "./board-zoom/register-legacy";
import { TaskboardZoomComponent } from "./taskboard-zoom/taskboard-zoom.component";
import "./taskboard-zoom/register-legacy";
import { KanbanBoardZoomComponent } from "./kanban-board-zoom/kanban-board-zoom.component";
import "./kanban-board-zoom/register-legacy";
import { DetailNavComponent } from "./detail-nav/detail-nav.component";
import "./detail-nav/register-legacy";
import { SwimlaneSelectorComponent } from "./swimlane-selector/swimlane-selector.component";
import "./swimlane-selector/register-legacy";
import { ColorSelectorComponent } from "./color-selector/color-selector.component";
import "./color-selector/register-legacy";
import { PromoteToUsButtonComponent } from "./promote-to-us/promote-to-us.component";
import "./promote-to-us/register-legacy";
import { TagComponent } from "./tag/tag.component";
import "./tag/register-legacy";
import { TgHomeProjectListUpgradedDirective } from "./upgraded/tg-home-project-list.upgraded-directive";
import { TgWorkingOnUpgradedDirective } from "./upgraded/tg-working-on.upgraded-directive";
import { TgDiscoverSearchBarUpgradedDirective } from "./upgraded/tg-discover-search-bar.upgraded-directive";
import { TgFeaturedProjectsUpgradedDirective } from "./upgraded/tg-featured-projects.upgraded-directive";
import { TgMostLikedUpgradedDirective } from "./upgraded/tg-most-liked.upgraded-directive";
import { TgMostActiveUpgradedDirective } from "./upgraded/tg-most-active.upgraded-directive";
import { TgSvgUpgradedDirective } from "./upgraded/tg-svg.upgraded-directive";
import { TgNotificationsListUpgradedDirective } from "./upgraded/tg-notifications-list.upgraded-directive";
import {
    AJS_APP_META_SERVICE,
    AJS_AVATAR_SERVICE,
    AJS_CONFIG,
    AJS_CONFIRM,
    AJS_CURRENT_USER_SERVICE,
    AJS_EMOJIS,
    AJS_EXTERNAL_APPS_SERVICE,
    AJS_LIVE_ANNOUNCEMENT_SERVICE,
    AJS_LOADER,
    AJS_LOCATION,
    AJS_NAV_URLS,
    AJS_NOTIFICATIONS_SERVICE,
    AJS_PROJECT_SERVICE,
    AJS_RESOURCES,
    AJS_TG_RESOURCES,
    AJS_ROOT_SCOPE,
    AJS_ROUTE_PARAMS,
    AJS_STORAGE,
    AJS_TG_LOCATION,
    AJS_TRANSLATE,
    AJS_WINDOW,
    AJS_XHR_ERROR_SERVICE,
    upgradedService,
} from "./shared/ajs-tokens";
import { TgTranslatePipe } from "./shared/translate.pipe";
import { TgEmojifyPipe } from "./shared/emojify.pipe";

/**
 * Hybrid shell for the AngularJS -> Angular migration: AngularJS keeps owning the app
 * ("taiga" module, ngRoute, all the un-migrated modules) and Angular components/services
 * are added incrementally via upgrade/downgrade. Nothing here replaces AngularJS yet.
 */
@NgModule({
    imports: [BrowserModule, UpgradeModule, FormsModule],
    declarations: [
        HomeComponent,
        DiscoverHomeComponent,
        DiscoverHomeOrderByComponent,
        DiscoverSearchListHeaderComponent,
        NotificationsComponent,
        ExternalAppComponent,
        ProfileHintsComponent,
        ProjectArchivedWarningComponent,
        TribeButtonComponent,
        LiveAnnouncementComponent,
        VoteButtonComponent,
        WipLimitSelectorComponent,
        InputSearchComponent,
        BoardZoomComponent,
        TaskboardZoomComponent,
        KanbanBoardZoomComponent,
        DetailNavComponent,
        SwimlaneSelectorComponent,
        ColorSelectorComponent,
        PromoteToUsButtonComponent,
        TagComponent,
        TgWorkingOnUpgradedDirective,
        TgHomeProjectListUpgradedDirective,
        TgDiscoverSearchBarUpgradedDirective,
        TgFeaturedProjectsUpgradedDirective,
        TgMostLikedUpgradedDirective,
        TgMostActiveUpgradedDirective,
        TgSvgUpgradedDirective,
        TgNotificationsListUpgradedDirective,
        TgTranslatePipe,
        TgEmojifyPipe,
    ],
    providers: [
        upgradedService(AJS_CURRENT_USER_SERVICE, "tgCurrentUserService"),
        upgradedService(AJS_NAV_URLS, "$tgNavUrls"),
        upgradedService(AJS_LOCATION, "$location"),
        upgradedService(AJS_TG_LOCATION, "$tgLocation"),
        upgradedService(AJS_TRANSLATE, "$translate"),
        upgradedService(AJS_APP_META_SERVICE, "tgAppMetaService"),
        upgradedService(AJS_ROOT_SCOPE, "$rootScope"),
        upgradedService(AJS_WINDOW, "$window"),
        upgradedService(AJS_NOTIFICATIONS_SERVICE, "tgNotificationsService"),
        upgradedService(AJS_ROUTE_PARAMS, "$routeParams"),
        upgradedService(AJS_EXTERNAL_APPS_SERVICE, "tgExternalAppsService"),
        upgradedService(AJS_XHR_ERROR_SERVICE, "tgXhrErrorService"),
        upgradedService(AJS_LOADER, "tgLoader"),
        upgradedService(AJS_AVATAR_SERVICE, "tgAvatarService"),
        upgradedService(AJS_PROJECT_SERVICE, "tgProjectService"),
        upgradedService(AJS_CONFIG, "$tgConfig"),
        upgradedService(AJS_LIVE_ANNOUNCEMENT_SERVICE, "tgLiveAnnouncementService"),
        upgradedService(AJS_RESOURCES, "tgResources"),
        upgradedService(AJS_TG_RESOURCES, "$tgResources"),
        upgradedService(AJS_STORAGE, "$tgStorage"),
        upgradedService(AJS_CONFIRM, "$tgConfirm"),
        upgradedService(AJS_EMOJIS, "$tgEmojis"),
    ],
})
export class AppModule implements DoBootstrap {
    constructor(private upgrade: UpgradeModule) {}

    ngDoBootstrap(): void {
        this.upgrade.bootstrap(document.body, ["taiga"], { strictDi: false });
    }
}
