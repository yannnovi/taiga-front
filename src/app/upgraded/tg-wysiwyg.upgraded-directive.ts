import { Directive, ElementRef, EventEmitter, Injector, Input, Output } from "@angular/core";
import { UpgradeComponent } from "@angular/upgrade/static";

/**
 * Wraps the still-AngularJS `tgWysiwyg` directive
 * (app/modules/components/wysiwyg/wysiwyg.directive.coffee) - the rich-text editor itself.
 * No CKEditor API is called directly anywhere in this repo: the real editor is a custom
 * element (`<tg-text-editor>`) built from a separate forked repo (`taiga-html-editor`,
 * bundled CKEditor5) and mounted imperatively by the directive's `link` function - not
 * something this migration replaces, per the roadmap's own recommendation (wrap, don't
 * rewrite). `tgWysiwyg` already has a clean isolate scope (`scope: {...}` in the original,
 * every binding a plain `<`/`&`, no ambient scope reads), so a single `UpgradeComponent`
 * wrapper is enough to make it usable from a future Angular component's template - same
 * one-line pattern as the other 8 wrappers in this directory.
 *
 * The 4 directives that compose `tgWysiwyg` today (`tgItemWysiwyg`/
 * `tgCommentEditWysiwyg`/`tgCommentWysiwyg`/`tgCustomFieldEditWysiwyg`) are `scope: true`
 * (ambient) and stay AngularJS for now - they live inside AngularJS templates
 * (`us-detail.jade`, `epic-detail.jade`, comment/custom-field markup) that are themselves
 * blocked on unrelated ambient-scope issues (Phase 3), so wrapping them individually has no
 * caller yet. This wrapper unblocks a *future* Angular component that wants `<tg-wysiwyg>`
 * directly, it does not migrate any of the 7 files that currently reach it through those 4
 * directives.
 */
@Directive({ selector: "tg-wysiwyg" })
export class TgWysiwygUpgradedDirective extends UpgradeComponent {
    @Input() htmlReadMode: any;
    @Input() editonly: any;
    @Input() project: any;
    @Input() placeholder: any;
    @Input() version: any;
    @Input() storageKey: any;
    @Input() content: any;
    @Input() onUploadFile: any;
    @Output() onCancel = new EventEmitter<void>();
    @Output() onSave = new EventEmitter<{ text: string; cb: () => void }>();
    @Output() onChange = new EventEmitter<{ markdown: string }>();

    constructor(elementRef: ElementRef, injector: Injector) {
        super("tgWysiwyg", elementRef, injector);
    }
}
