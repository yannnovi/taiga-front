import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { DiscoverSearchListHeaderComponent } from "./discover-search-list-header.component";

/**
 * Replaces the old AngularJS `tgDiscoverSearchListHeader` directive
 * (app/modules/discover/components/discover-search-list-header/) in place, under the
 * same name, on the pre-existing `taigaDiscover` module. Caller (discover-search.jade)
 * updated to use `bind-order-by`/`$event` - see MIGRATION.md.
 */
angular
    .module("taigaDiscover")
    .directive(
        "tgDiscoverSearchListHeader",
        downgradeComponent({ component: DiscoverSearchListHeaderComponent }),
    );
