import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { ThirdPartyWebhookFormComponent } from "./third-party-webhook-form.component";

/**
 * Registers the shared third-party webhook form on the pre-existing `taigaAdmin` module -
 * replaces `tgGithubWebhooks`/`tgGitlabWebhooks`/`tgBitbucketWebhooks`/`tgGogsWebhooks`
 * (app/coffee/modules/admin/third-parties.coffee) under one selector.
 */
angular
    .module("taigaAdmin")
    .directive("tgThirdPartyWebhookForm", downgradeComponent({ component: ThirdPartyWebhookFormComponent }));
