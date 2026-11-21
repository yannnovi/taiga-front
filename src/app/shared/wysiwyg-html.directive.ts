import { Directive, ElementRef, Inject, Input, OnChanges } from "@angular/core";
import { AJS_SCE, AJS_WYSIWYG_SERVICE } from "./ajs-tokens";

declare const hljs: any;
declare const ljs: any;

/**
 * Angular equivalent of the AngularJS `tg-bind-wysiwyg-html` attribute
 * (`app/modules/components/bind-wysiwyg-html.coffee`), for read-only rich text in Angular
 * templates: `<div class="wysiwyg" [tgWysiwygHtml]="item.content"></div>`.
 *
 * Same pipeline as the original: `tgWysiwygService.getHTML` (markdown -> HTML),
 * `relativePaths`, then `refreshAttachmentURL` (async, re-render when done); the HTML goes
 * through AngularJS `$sce.getTrustedHtml` (ngSanitize, with the same `input`/`checked`
 * allowance for task lists) rather than Angular's sanitizer, so both render identically;
 * `pre code` blocks are highlighted with highlight.js (loading the language on demand) and
 * in-page `#anchor` links scroll instead of navigating.
 */
@Directive({ selector: "[tgWysiwygHtml]" })
export class TgWysiwygHtmlDirective implements OnChanges {
    @Input() tgWysiwygHtml: string | null | undefined;

    private renderId = 0;

    constructor(
        private elementRef: ElementRef<HTMLElement>,
        @Inject(AJS_WYSIWYG_SERVICE) private wysiwygService: any,
        @Inject(AJS_SCE) private sce: any,
    ) {}

    ngOnChanges(): void {
        const id = ++this.renderId;
        let html = this.wysiwygService.getHTML(`${this.tgWysiwygHtml || ""}`);
        html = this.wysiwygService.relativePaths(html);

        this.render(html);

        Promise.resolve(this.wysiwygService.refreshAttachmentURL(html)).then((refreshed: string) => {
            if (id === this.renderId) {
                this.render(refreshed);
            }
        });
    }

    private render(html: string): void {
        const element = this.elementRef.nativeElement;

        (window as any)._extraValidHtmlElments = { input: true };
        (window as any)._extraValidAttrs = { checked: true };

        element.innerHTML = this.sce.getTrustedHtml(html) || "";

        element.querySelectorAll("pre code").forEach((block: Element) => {
            const blockClasses = `${block.className} ${(block.parentNode as Element | null)?.className || ""}`;
            const match = /\blang(?:uage)?-([\w-]+)\b/i.exec(blockClasses);
            const language = match && match.length ? match[1] : "plaintext";

            if (hljs.getLanguage(language)) {
                hljs.highlightBlock(block);
            } else {
                ljs.load(`/${(window as any)._version}/highlightjs-languages/${language}.min.js`, () => hljs.highlightBlock(block));
            }
        });

        element.querySelectorAll('a[href^="#"]').forEach((link: Element) => {
            link.addEventListener("click", (event) => {
                event.preventDefault();
                const target = document.querySelector(link.getAttribute("href") as string);
                target?.scrollIntoView();
            });
        });
    }
}
