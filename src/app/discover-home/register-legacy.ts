import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { DiscoverHomeComponent } from "./discover-home.component";

/**
 * Exposes DiscoverHomeComponent to AngularJS as `<tg-discover-home>`, registered on the
 * pre-existing `taigaDiscover` module (app/modules/discover/discover.module.coffee, still
 * a dependency of the root "taiga" module). The "/discover" ngRoute route now renders
 * `template: "<tg-discover-home></tg-discover-home>"` instead of the old
 * templateUrl/controller pair.
 */
angular
    .module("taigaDiscover")
    .directive("tgDiscoverHome", downgradeComponent({ component: DiscoverHomeComponent }));
