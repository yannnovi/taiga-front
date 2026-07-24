import { Component, EventEmitter, Input, Output } from "@angular/core";

/**
 * Angular replacement for the AngularJS `tgTag` directive
 * (app/modules/components/tags/tag/), downgraded in place under the same name. `tag` is a
 * 2-element tuple: `tag[0]` is the name, `tag[1]` the color.
 *
 * `isArchived`/`hasPermissions` were AngularJS `&`/`<` bindings evaluated as
 * `vm.isArchived()`/`vm.checkPermissions()` by the caller (tag-line-common.jade, still
 * AngularJS) - simplified to plain `@Input()` booleans here. `bind-is-archived="vm.isArchived()"`
 * still re-evaluates that expression on every AngularJS digest via the underlying
 * `$watch`, so it stays just as live as the original `&` call.
 *
 * `onDeleteTag` (`&`, invoked as `onDeleteTag(tag)`) is a real `@Output()` here -
 * caller updated from `on-delete-tag="vm.onDeleteTag({tag: tag})"` to
 * `on-delete-tag="vm.onDeleteTag($event.tag)"`.
 */
@Component({
    selector: "tg-tag",
    templateUrl: "./tag.component.html",
})
export class TagComponent {
    @Input() tag: any;
    @Input() loadingRemoveTag: any;
    @Input() hasPermissions: any;
    @Input() isArchived: any;
    @Output() deleteTag = new EventEmitter<{ tag: any }>();

    onDelete(): void {
        this.deleteTag.emit({ tag: this.tag });
    }
}
