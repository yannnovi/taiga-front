import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { AnimatedCounterComponent } from "./animated-counter.component";

/**
 * Replaces the old AngularJS `tgAnimatedCounter` directive in place, under the same name,
 * on the pre-existing `taigaComponents` module.
 */
angular
    .module("taigaComponents")
    .directive("tgAnimatedCounter", downgradeComponent({ component: AnimatedCounterComponent }));
