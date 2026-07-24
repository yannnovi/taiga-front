import { InjectionToken, Provider } from "@angular/core";

/**
 * Tokens + provider factory to reuse existing AngularJS services from Angular code
 * during the migration, instead of reimplementing them. Each provider pulls the named
 * service out of the AngularJS injector exposed by UpgradeModule (the special
 * '$injector' token).
 */
export const AJS_CURRENT_USER_SERVICE = new InjectionToken<any>("tgCurrentUserService");
export const AJS_NAV_URLS = new InjectionToken<any>("$tgNavUrls");
export const AJS_LOCATION = new InjectionToken<any>("$location");
export const AJS_TG_LOCATION = new InjectionToken<any>("$tgLocation");
export const AJS_TRANSLATE = new InjectionToken<any>("$translate");
export const AJS_APP_META_SERVICE = new InjectionToken<any>("tgAppMetaService");
export const AJS_ROOT_SCOPE = new InjectionToken<any>("$rootScope");
export const AJS_WINDOW = new InjectionToken<any>("$window");
export const AJS_NOTIFICATIONS_SERVICE = new InjectionToken<any>("tgNotificationsService");
export const AJS_ROUTE_PARAMS = new InjectionToken<any>("$routeParams");
export const AJS_EXTERNAL_APPS_SERVICE = new InjectionToken<any>("tgExternalAppsService");
export const AJS_XHR_ERROR_SERVICE = new InjectionToken<any>("tgXhrErrorService");
export const AJS_LOADER = new InjectionToken<any>("tgLoader");
export const AJS_AVATAR_SERVICE = new InjectionToken<any>("tgAvatarService");
export const AJS_PROJECT_SERVICE = new InjectionToken<any>("tgProjectService");
export const AJS_CONFIG = new InjectionToken<any>("$tgConfig");
export const AJS_LIVE_ANNOUNCEMENT_SERVICE = new InjectionToken<any>("tgLiveAnnouncementService");
// There are genuinely two different resources services in this codebase:
// - "tgResources" (no `$`, app/modules/resources/resources.coffee): a newer, smaller
//   aggregator - only wraps a handful of *-resource.service.coffee files.
// - "$tgResources" (with `$`, app/coffee/modules/resources.coffee): the original, fully
//   populated one - assembled at app startup from every $tgXxxResourcesProvider in
//   app/coffee/modules/resources/*.coffee (getQueryParams, promoteToUserStory,
//   wipLimitUpdate, editStatus, etc. all live only here).
// Earlier commits (wip-limit-selector, detail-nav, promote-to-us) wrongly treated
// "$tgResources" as a typo for "tgResources" based on an incomplete grep - it isn't, and
// that "fix" broke all three. AJS_RESOURCES is the limited one; use AJS_TG_RESOURCES for
// anything that needs the full API.
export const AJS_RESOURCES = new InjectionToken<any>("tgResources");
export const AJS_TG_RESOURCES = new InjectionToken<any>("$tgResources");
export const AJS_STORAGE = new InjectionToken<any>("$tgStorage");
export const AJS_CONFIRM = new InjectionToken<any>("$tgConfirm");
export const AJS_EMOJIS = new InjectionToken<any>("$tgEmojis");
export const AJS_WYSIWYG_SERVICE = new InjectionToken<any>("tgWysiwygService");
export const AJS_TASKBOARD_TASKS_SERVICE = new InjectionToken<any>("tgTaskboardTasks");
export const AJS_LIGHTBOX_FACTORY = new InjectionToken<any>("tgLightboxFactory");
export const AJS_ATTACHMENTS_SERVICE = new InjectionToken<any>("tgAttachmentsService");
export const AJS_LIKE_PROJECT_BUTTON_SERVICE = new InjectionToken<any>("tgLikeProjectButtonService");
export const AJS_WATCH_PROJECT_BUTTON_SERVICE = new InjectionToken<any>("tgWatchProjectButtonService");
export const AJS_TAG_LINE_SERVICE = new InjectionToken<any>("tgTagLineService");
export const AJS_QUEUE_MODEL_TRANSFORMATION = new InjectionToken<any>("$tgQueueModelTransformation");
export const AJS_ATTACHMENTS_PREVIEW_SERVICE = new InjectionToken<any>("tgAttachmentsPreviewService");
export const AJS_LIGHTBOX_SERVICE = new InjectionToken<any>("lightboxService");
export const AJS_USER_SERVICE = new InjectionToken<any>("tgUserService");
export const AJS_PROJECT_LOGO_SERVICE = new InjectionToken<any>("tgProjectLogoService");
export const AJS_AUTH = new InjectionToken<any>("$tgAuth");
export const AJS_SECTIONS = new InjectionToken<any>("$tgSections");

export function upgradedService(token: InjectionToken<any>, ajsName: string): Provider {
    return {
        provide: token,
        useFactory: (i: any) => i.get(ajsName),
        deps: ["$injector"],
    };
}
