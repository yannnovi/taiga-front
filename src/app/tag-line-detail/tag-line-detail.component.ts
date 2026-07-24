import { Component, Inject, Input } from "@angular/core";
import { AJS_CONFIRM, AJS_QUEUE_MODEL_TRANSFORMATION, AJS_ROOT_SCOPE } from "../shared/ajs-tokens";

declare const _: any;
declare const taiga: any;

/**
 * Angular replacement for the AngularJS `tgTagLine` directive
 * (app/modules/components/tags/tag-line-detail/ - the directive itself is registered as
 * `tgTagLine`, despite the folder name), downgraded in place under the same name. A thin
 * wrapper around `tg-tag-line-common` (also migrated in this batch) that adds the
 * save-via-`$tgQueueModelTransformation` persistence logic.
 */
@Component({
    selector: "tg-tag-line",
    templateUrl: "./tag-line-detail.component.html",
})
export class TagLineDetailComponent {
    @Input() item: any;
    @Input() permissions: string | undefined;
    @Input() project: any;

    loadingAddTag = false;
    loadingRemoveTag: any;

    constructor(
        @Inject(AJS_ROOT_SCOPE) private rootScope: any,
        @Inject(AJS_CONFIRM) private confirm: any,
        @Inject(AJS_QUEUE_MODEL_TRANSFORMATION) private modelTransform: any,
    ) {}

    onDeleteTag(tag: [string, string]): any {
        this.loadingRemoveTag = tag[0];

        const tagName = taiga.trim(tag[0].toLowerCase());

        const transform = this.modelTransform.save((item: any) => {
            const itemtags = _.clone(item.tags);

            _.remove(itemtags, (t: [string, string]) => t[0] === tagName);

            item.tags = itemtags;

            return item;
        });

        return transform.then(
            (item: any) => {
                this.rootScope.$broadcast("object:updated");
                this.loadingRemoveTag = false;

                return item;
            },
            () => {
                this.confirm.notify("error");
                this.loadingRemoveTag = false;
            },
        );
    }

    onAddTag(name: string, color: string | null): any {
        this.loadingAddTag = true;

        const transform = this.modelTransform.save((item: any) => {
            const itemtags = _.clone(item.tags);

            itemtags.push([name, color]);

            item.tags = itemtags;

            return item;
        });

        return transform.then(
            (item: any) => {
                this.rootScope.$broadcast("object:updated");
                this.rootScope.$broadcast("tags:updated");
                this.loadingAddTag = false;

                return item;
            },
            () => {
                this.loadingAddTag = false;
                this.confirm.notify("error");
            },
        );
    }
}
