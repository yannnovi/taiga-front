import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { CardComponent } from "./card.component";

/**
 * Replaces the old AngularJS `tgCard` directive in place, under the same name, on the
 * pre-existing `taigaComponents` module.
 */
angular.module("taigaComponents").directive("tgCard", downgradeComponent({ component: CardComponent }));
