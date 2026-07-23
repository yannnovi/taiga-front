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

export function upgradedService(token: InjectionToken<any>, ajsName: string): Provider {
    return {
        provide: token,
        useFactory: (i: any) => i.get(ajsName),
        deps: ["$injector"],
    };
}
