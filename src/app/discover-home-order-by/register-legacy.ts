import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { DiscoverHomeOrderByComponent } from "./discover-home-order-by.component";

/**
 * Replaces the old AngularJS `tgDiscoverHomeOrderBy` directive
 * (app/modules/discover/components/discover-home-order-by/) in place, under the same
 * name, on the pre-existing `taigaDiscover` module. Existing callers
 * (most-liked.jade, most-active.jade: `tg-discover-home-order-by(on-change=... order-by=...)`)
 * keep working unchanged - downgradeComponent maps the @Input/@Output names to the same
 * kebab-case attribute names AngularJS already used for isolate scope bindings.
 */
angular
    .module("taigaDiscover")
    .directive("tgDiscoverHomeOrderBy", downgradeComponent({ component: DiscoverHomeOrderByComponent }));
