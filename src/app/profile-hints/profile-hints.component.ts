import { Component, Inject } from "@angular/core";
import { AJS_TRANSLATE } from "../shared/ajs-tokens";

interface Hint {
    url?: string;
    linkText?: string;
    title?: string;
    text?: string;
}

/**
 * Angular replacement for the AngularJS `tgProfileHints` directive
 * (app/modules/profile/profile-hints/) - a random static hint shown in the profile
 * sidebar. Downgraded in register-legacy.ts under the same directive name.
 *
 * Note: `downgradeComponent`'s generated AngularJS directive is element-restricted
 * (`restrict: 'E'`), but the original directive was used as a plain attribute
 * (`div.profile-hints(tg-profile-hints)`, restrict defaults to 'EA'). Its one caller
 * (profile-sidebar.jade, still AngularJS) was updated to the element form
 * (`tg-profile-hints.profile-hints`) - see MIGRATION.md.
 */
@Component({
    selector: "tg-profile-hints",
    templateUrl: "./profile-hints.component.html",
})
export class ProfileHintsComponent {
    private readonly hints: Hint[] = [
        { url: "https://community.taiga.io/t/import-export-taiga-projects/168" },
        {
            url: "https://community.taiga.io/t/customisation-for-your-projects/127#tier-4-custom-fields-and-due-dates-5",
        },
        {},
        {},
    ];

    hint: Hint;
    linkTextTranslated = "";

    constructor(@Inject(AJS_TRANSLATE) private translate: any) {
        const hintKey = Math.floor(Math.random() * this.hints.length) + 1;
        this.hint = this.hints[hintKey - 1];

        this.hint.linkText = this.hint.linkText || "HINTS.LINK";
        this.hint.title = this.translate.instant(`HINTS.HINT${hintKey}_TITLE`);
        this.hint.text = this.translate.instant(`HINTS.HINT${hintKey}_TEXT`);

        this.linkTextTranslated = this.translate.instant(this.hint.linkText);
    }
}
