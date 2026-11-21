import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { UsEstimationComponent } from "./us-estimation.component";

/** Replaces `tgUsEstimation` (and its `$tgEstimationsService`), same name, now an element. */
angular.module("taigaCommon").directive("tgUsEstimation", downgradeComponent({ component: UsEstimationComponent }));
