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
import { HistoryEntryComponent } from "./history-entry/history-entry.component";
import "./history-entry/register-legacy";
import { UserTimelineAttachmentComponent } from "./user-timeline-attachment/user-timeline-attachment.component";
import "./user-timeline-attachment/register-legacy";
import { MoveToSprintComponent } from "./move-to-sprint/move-to-sprint.component";
import "./move-to-sprint/register-legacy";
import { SuggestAddMembersComponent } from "./suggest-add-members/suggest-add-members.component";
import "./suggest-add-members/register-legacy";
import { AttachmentsSimpleComponent } from "./attachments-simple/attachments-simple.component";
import "./attachments-simple/register-legacy";
import { ContactProjectButtonComponent } from "./contact-project-button/contact-project-button.component";
import "./contact-project-button/register-legacy";
import { LikeProjectButtonComponent } from "./like-project-button/like-project-button.component";
import "./like-project-button/register-legacy";
import { WatchProjectButtonComponent } from "./watch-project-button/watch-project-button.component";
import "./watch-project-button/register-legacy";
import { BlockedProjectExplanationComponent } from "./blocked-project-explanation/blocked-project-explanation.component";
import "./blocked-project-explanation/register-legacy";
import { CantOwnProjectExplanationComponent } from "./cant-own-project-explanation/cant-own-project-explanation.component";
import "./cant-own-project-explanation/register-legacy";
import { HistoryTabsComponent } from "./history-tabs/history-tabs.component";
import "./history-tabs/register-legacy";
import { TagDropdownComponent } from "./tag-dropdown/tag-dropdown.component";
import "./tag-dropdown/register-legacy";
import { TagLineCommonComponent } from "./tag-line-common/tag-line-common.component";
import "./tag-line-common/register-legacy";
import { TagLineDetailComponent } from "./tag-line-detail/tag-line-detail.component";
import "./tag-line-detail/register-legacy";
import { TermsOfServiceAndPrivacyPolicyNoticeComponent } from "./terms-of-service-and-privacy-policy-notice/terms-of-service-and-privacy-policy-notice.component";
import "./terms-of-service-and-privacy-policy-notice/register-legacy";
import { AttachmentComponent } from "./attachment/attachment.component";
import "./attachment/register-legacy";
import { AttachmentGalleryComponent } from "./attachment-gallery/attachment-gallery.component";
import "./attachment-gallery/register-legacy";
import { LightboxAddMembersWarningMessageComponent } from "./lightbox-add-members-warning-message/lightbox-add-members-warning-message.component";
import "./lightbox-add-members-warning-message/register-legacy";
import { InviteMembersFormComponent } from "./invite-members-form/invite-members-form.component";
import "./invite-members-form/register-legacy";
import { LightboxAddMembersComponent } from "./lightbox-add-members/lightbox-add-members.component";
import "./lightbox-add-members/register-legacy";
import { LightboxDisplayHistoricComponent } from "./lightbox-display-historic/lightbox-display-historic.component";
import "./lightbox-display-historic/register-legacy";
import { SingleMemberComponent } from "./single-member/single-member.component";
import "./single-member/register-legacy";
import { InviteMembersComponent } from "./invite-members/invite-members.component";
import "./invite-members/register-legacy";
import { WikiHistoryDiffComponent } from "./wiki-history-diff/wiki-history-diff.component";
import "./wiki-history-diff/register-legacy";
import { WikiHistoryEntryComponent } from "./wiki-history-entry/wiki-history-entry.component";
import "./wiki-history-entry/register-legacy";
import { NewsletterEmailLightboxComponent } from "./newsletter-email-lightbox/newsletter-email-lightbox.component";
import "./newsletter-email-lightbox/register-legacy";
import { LightboxMoveToSprintComponent } from "./lightbox-move-to-sprint/lightbox-move-to-sprint.component";
import "./lightbox-move-to-sprint/register-legacy";
import { AttachmentsPreviewComponent } from "./attachments-preview/attachments-preview.component";
import "./attachments-preview/register-legacy";
import { NoMoreMembershipsExplanationComponent } from "./no-more-memberships-explanation/no-more-memberships-explanation.component";
import "./no-more-memberships-explanation/register-legacy";
import { DutyComponent } from "./duty/duty.component";
import "./duty/register-legacy";
import { PublicRegisterMessageComponent } from "./public-register-message/public-register-message.component";
import "./public-register-message/register-legacy";
import { ProfileBarComponent } from "./profile-bar/profile-bar.component";
import "./profile-bar/register-legacy";
import { DropdownProjectListComponent } from "./dropdown-project-list/dropdown-project-list.component";
import "./dropdown-project-list/register-legacy";
import { DropdownUserComponent } from "./dropdown-user/dropdown-user.component";
import "./dropdown-user/register-legacy";
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
    AJS_WYSIWYG_SERVICE,
    AJS_LIGHTBOX_FACTORY,
    AJS_ATTACHMENTS_SERVICE,
    AJS_LIKE_PROJECT_BUTTON_SERVICE,
    AJS_WATCH_PROJECT_BUTTON_SERVICE,
    AJS_TAG_LINE_SERVICE,
    AJS_QUEUE_MODEL_TRANSFORMATION,
    AJS_ATTACHMENTS_PREVIEW_SERVICE,
    AJS_LIGHTBOX_SERVICE,
    AJS_USER_SERVICE,
    AJS_PROJECT_LOGO_SERVICE,
    AJS_AUTH,
    AJS_SECTIONS,
    AJS_PROJECTS_SERVICE,
    upgradedService,
} from "./shared/ajs-tokens";
import { TgTranslatePipe } from "./shared/translate.pipe";
import { TgEmojifyPipe } from "./shared/emojify.pipe";
import { TgMomentFormatPipe } from "./shared/moment-format.pipe";
import { TgMarkdownToHtmlPipe } from "./shared/markdown-to-html.pipe";
import { TgSizeFormatPipe } from "./shared/size-format.pipe";
import { TgNavDirective } from "./shared/tg-nav.directive";

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
        HistoryEntryComponent,
        UserTimelineAttachmentComponent,
        MoveToSprintComponent,
        SuggestAddMembersComponent,
        AttachmentsSimpleComponent,
        ContactProjectButtonComponent,
        LikeProjectButtonComponent,
        WatchProjectButtonComponent,
        BlockedProjectExplanationComponent,
        CantOwnProjectExplanationComponent,
        HistoryTabsComponent,
        TagDropdownComponent,
        TagLineCommonComponent,
        TagLineDetailComponent,
        TermsOfServiceAndPrivacyPolicyNoticeComponent,
        AttachmentComponent,
        AttachmentGalleryComponent,
        LightboxAddMembersWarningMessageComponent,
        InviteMembersFormComponent,
        LightboxAddMembersComponent,
        LightboxDisplayHistoricComponent,
        SingleMemberComponent,
        InviteMembersComponent,
        WikiHistoryDiffComponent,
        WikiHistoryEntryComponent,
        NewsletterEmailLightboxComponent,
        LightboxMoveToSprintComponent,
        AttachmentsPreviewComponent,
        NoMoreMembershipsExplanationComponent,
        DutyComponent,
        PublicRegisterMessageComponent,
        ProfileBarComponent,
        DropdownProjectListComponent,
        DropdownUserComponent,
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
        TgMomentFormatPipe,
        TgMarkdownToHtmlPipe,
        TgSizeFormatPipe,
        TgNavDirective,
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
        upgradedService(AJS_WYSIWYG_SERVICE, "tgWysiwygService"),
        upgradedService(AJS_LIGHTBOX_FACTORY, "tgLightboxFactory"),
        upgradedService(AJS_ATTACHMENTS_SERVICE, "tgAttachmentsService"),
        upgradedService(AJS_LIKE_PROJECT_BUTTON_SERVICE, "tgLikeProjectButtonService"),
        upgradedService(AJS_WATCH_PROJECT_BUTTON_SERVICE, "tgWatchProjectButtonService"),
        upgradedService(AJS_TAG_LINE_SERVICE, "tgTagLineService"),
        upgradedService(AJS_QUEUE_MODEL_TRANSFORMATION, "$tgQueueModelTransformation"),
        upgradedService(AJS_ATTACHMENTS_PREVIEW_SERVICE, "tgAttachmentsPreviewService"),
        upgradedService(AJS_LIGHTBOX_SERVICE, "lightboxService"),
        upgradedService(AJS_USER_SERVICE, "tgUserService"),
        upgradedService(AJS_PROJECT_LOGO_SERVICE, "tgProjectLogoService"),
        upgradedService(AJS_AUTH, "$tgAuth"),
        upgradedService(AJS_SECTIONS, "$tgSections"),
        upgradedService(AJS_PROJECTS_SERVICE, "tgProjectsService"),
    ],
})
export class AppModule implements DoBootstrap {
    constructor(private upgrade: UpgradeModule) {}

    ngDoBootstrap(): void {
        this.upgrade.bootstrap(document.body, ["taiga"], { strictDi: false });
    }
}
