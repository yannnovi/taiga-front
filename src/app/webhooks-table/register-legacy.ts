import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { WebhooksTableComponent } from "./webhooks-table.component";

/**
 * Registers the webhooks admin table on the pre-existing `taigaAdmin` module - replaces
 * the AngularJS `tgWebhook`/`tgNewWebhook` directives
 * (app/coffee/modules/admin/third-parties.coffee).
 */
angular.module("taigaAdmin").directive("tgWebhooksTable", downgradeComponent({ component: WebhooksTableComponent }));
