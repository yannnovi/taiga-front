import { Inject, Pipe, PipeTransform } from "@angular/core";
import { AJS_WYSIWYG_SERVICE } from "./ajs-tokens";

/**
 * Angular equivalent of the AngularJS `{{ x | markdownToHTML }}` filter
 * (app/coffee/modules/common/filters.coffee), which renders markdown via
 * `tgWysiwygService.getHTML()`. Used with `[innerHTML]` (Angular sanitizes it
 * automatically), same as the original's `ng-bind-html` + `| markdownToHTML`.
 */
@Pipe({ name: "tgMarkdownToHtml" })
export class TgMarkdownToHtmlPipe implements PipeTransform {
    constructor(@Inject(AJS_WYSIWYG_SERVICE) private wysiwygService: any) {}

    transform(input: string): string {
        if (!input) {
            return "";
        }

        return this.wysiwygService.getHTML(input);
    }
}
