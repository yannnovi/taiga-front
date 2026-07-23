import { DoBootstrap, NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { UpgradeModule } from "@angular/upgrade/static";

import { HomeComponent } from "./home/home.component";
import "./home/register-legacy";
import { TgHomeProjectListUpgradedDirective } from "./upgraded/tg-home-project-list.upgraded-directive";
import { TgWorkingOnUpgradedDirective } from "./upgraded/tg-working-on.upgraded-directive";
import { AJS_CURRENT_USER_SERVICE, AJS_LOCATION, AJS_NAV_URLS, AJS_TRANSLATE, upgradedService } from "./shared/ajs-tokens";
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
        TgWorkingOnUpgradedDirective,
        TgHomeProjectListUpgradedDirective,
        TgTranslatePipe,
    ],
    providers: [
        upgradedService(AJS_CURRENT_USER_SERVICE, "tgCurrentUserService"),
        upgradedService(AJS_NAV_URLS, "$tgNavUrls"),
        upgradedService(AJS_LOCATION, "$location"),
        upgradedService(AJS_TRANSLATE, "$translate"),
    ],
})
export class AppModule implements DoBootstrap {
    constructor(private upgrade: UpgradeModule) {}

    ngDoBootstrap(): void {
        this.upgrade.bootstrap(document.body, ["taiga"], { strictDi: false });
    }
}
