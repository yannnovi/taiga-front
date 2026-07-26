import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { CardSlideshowComponent } from "./card-slideshow.component";

/**
 * Replaces the old AngularJS `tgCardSlideshow` directive in place, under the same name,
 * on the pre-existing `taigaComponents` module.
 */
angular
    .module("taigaComponents")
    .directive("tgCardSlideshow", downgradeComponent({ component: CardSlideshowComponent }));
