import { Component, Inject, Input } from "@angular/core";
import { AJS_CONFIRM, AJS_PROJECT_SERVICE, AJS_ROOT_SCOPE, AJS_TG_RESOURCES, AJS_TRANSLATE } from "../shared/ajs-tokens";

declare const _: any;

/**
 * Angular replacement for the AngularJS `tgPromoteToUsButton` directive
 * (app/modules/components/promote-to-us/), downgraded in place under the same name.
 *
 * Correction: an earlier version "fixed" the original's `"$tgResources"` injection to the
 * unprefixed `tgResources`, believing it was a typo - it isn't, `$tgResources` (with the
 * `$`) is a real, separate, fully populated resources service with `.tasks`/`.issues`
 * sub-objects exposing `promoteToUserStory`, distinct from the smaller `tgResources`
 * aggregator that doesn't have it. See ajs-tokens.ts. Fixed to use AJS_TG_RESOURCES.
 *
 * `require: "ngModel"` (the item to promote) is a plain `@Input() item` here instead -
 * caller switched from `ng-model="issue"` to `bind-item="issue"`.
 *
 * `tg-check-permission="add_us"` (app/coffee/modules/common.coffee) - another
 * template-less attribute directive, not an UpgradeComponent fit - replicated inline via
 * `tgProjectService`. Both current callers (issues-detail.jade, task-detail.jade) always
 * used the literal permission `"add_us"`, so it's hardcoded here rather than exposed as
 * another input for a flexibility nothing currently uses.
 */
@Component({
    selector: "tg-promote-to-us-button",
    templateUrl: "./promote-to-us.component.html",
})
export class PromoteToUsButtonComponent {
    @Input() item: any;

    constructor(
        @Inject(AJS_ROOT_SCOPE) private rootScope: any,
        @Inject(AJS_TG_RESOURCES) private rs: any,
        @Inject(AJS_CONFIRM) private confirm: any,
        @Inject(AJS_TRANSLATE) private translate: any,
        @Inject(AJS_PROJECT_SERVICE) private projectService: any,
    ) {}

    canPromote(): boolean {
        return !!(this.projectService.project && this.projectService.canEdit("add_us"));
    }

    promote(): void {
        const item = this.item;
        const itemType = _.get({ tasks: "task", issues: "issue" }, item._name);

        const ctx = `COMMON.CONFIRM_PROMOTE.${itemType.toUpperCase()}`;
        const title = this.translate.instant(`${ctx}.TITLE`);
        const message = this.translate.instant(`${ctx}.MESSAGE`);
        const subtitle = item.subject;

        this.confirm.ask(title, subtitle, message).then((askResponse: any) => {
            this.save(item, itemType, askResponse);
        });
    }

    private save(item: any, itemType: string, askResponse: any): void {
        const onSuccess = (response: any) => {
            askResponse.finish();
            this.confirm.notify("success");
            this.rootScope.$broadcast(`promote-${itemType}-to-us:success`, response.data[0]);
        };

        const onError = () => {
            askResponse.finish();
            this.confirm.notify("error");
        };

        this.rs[item._name].promoteToUserStory(item.id, item.project).then(onSuccess, onError);
    }
}
