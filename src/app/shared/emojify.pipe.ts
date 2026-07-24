import { Inject, Pipe, PipeTransform } from "@angular/core";
import { AJS_EMOJIS } from "./ajs-tokens";

declare const _: any;

/**
 * Angular equivalent of the AngularJS `{{ x | emojify }}` filter
 * (app/coffee/modules/common/filters.coffee), which replaces emoji shortcodes with `<img>`
 * tags via `$tgEmojis`. Used with `[innerHTML]` (Angular sanitizes it automatically), same
 * as the original combined `ng-bind-html` + `| emojify`.
 */
@Pipe({ name: "tgEmojify" })
export class TgEmojifyPipe implements PipeTransform {
    constructor(@Inject(AJS_EMOJIS) private emojis: any) {}

    transform(input: string): string {
        if (!input) {
            return "";
        }

        return _.unescape(this.emojis.replaceEmojiNameByHtmlImgs(_.escape(input)));
    }
}
