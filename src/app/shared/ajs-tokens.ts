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
export const AJS_TRANSLATE = new InjectionToken<any>("$translate");

export function upgradedService(token: InjectionToken<any>, ajsName: string): Provider {
    return {
        provide: token,
        useFactory: (i: any) => i.get(ajsName),
        deps: ["$injector"],
    };
}
