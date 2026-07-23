import { DoBootstrap, NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { UpgradeModule } from "@angular/upgrade/static";

import { HomeComponent } from "./home/home.component";
import "./home/register-legacy";
import { DiscoverHomeComponent } from "./discover-home/discover-home.component";
import "./discover-home/register-legacy";
import { DiscoverHomeOrderByComponent } from "./discover-home-order-by/discover-home-order-by.component";
import "./discover-home-order-by/register-legacy";
import { DiscoverSearchListHeaderComponent } from "./discover-search-list-header/discover-search-list-header.component";
import "./discover-search-list-header/register-legacy";
import { TgHomeProjectListUpgradedDirective } from "./upgraded/tg-home-project-list.upgraded-directive";
import { TgWorkingOnUpgradedDirective } from "./upgraded/tg-working-on.upgraded-directive";
import { TgDiscoverSearchBarUpgradedDirective } from "./upgraded/tg-discover-search-bar.upgraded-directive";
import { TgFeaturedProjectsUpgradedDirective } from "./upgraded/tg-featured-projects.upgraded-directive";
import { TgMostLikedUpgradedDirective } from "./upgraded/tg-most-liked.upgraded-directive";
import { TgMostActiveUpgradedDirective } from "./upgraded/tg-most-active.upgraded-directive";
import { TgSvgUpgradedDirective } from "./upgraded/tg-svg.upgraded-directive";
import {
    AJS_APP_META_SERVICE,
    AJS_CURRENT_USER_SERVICE,
    AJS_LOCATION,
    AJS_NAV_URLS,
    AJS_TG_LOCATION,
    AJS_TRANSLATE,
    upgradedService,
} from "./shared/ajs-tokens";
import { TgTranslatePipe } from "./shared/translate.pipe";

/**
 * Hybrid shell for the AngularJS -> Angular migration: AngularJS keeps owning the app
 * ("taiga" module, ngRoute, all the un-migrated modules) and Angular components/services
 * are added incrementally via upgrade/downgrade. Nothing here replaces AngularJS yet.
 */
@NgModule({
    imports: [BrowserModule, UpgradeModule],
    declarations: [
        HomeComponent,
        DiscoverHomeComponent,
        DiscoverHomeOrderByComponent,
        DiscoverSearchListHeaderComponent,
        TgWorkingOnUpgradedDirective,
        TgHomeProjectListUpgradedDirective,
        TgDiscoverSearchBarUpgradedDirective,
        TgFeaturedProjectsUpgradedDirective,
        TgMostLikedUpgradedDirective,
        TgMostActiveUpgradedDirective,
        TgSvgUpgradedDirective,
        TgTranslatePipe,
    ],
    providers: [
        upgradedService(AJS_CURRENT_USER_SERVICE, "tgCurrentUserService"),
        upgradedService(AJS_NAV_URLS, "$tgNavUrls"),
        upgradedService(AJS_LOCATION, "$location"),
        upgradedService(AJS_TG_LOCATION, "$tgLocation"),
        upgradedService(AJS_TRANSLATE, "$translate"),
        upgradedService(AJS_APP_META_SERVICE, "tgAppMetaService"),
    ],
})
export class AppModule implements DoBootstrap {
    constructor(private upgrade: UpgradeModule) {}

    ngDoBootstrap(): void {
        this.upgrade.bootstrap(document.body, ["taiga"], { strictDi: false });
    }
}
