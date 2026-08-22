import { Inject, Injectable } from "@angular/core";
import { ValidationErrors } from "@angular/forms";
import { AJS_TRANSLATE } from "./ajs-tokens";

/**
 * Central translated-message registry for Reactive Forms validation errors, replacing
 * checksley's own `checksley.updateMessages('default', messages)` registry
 * (`app/coffee/app.coffee`'s `i18nInit`) for every form migrated to `ReactiveFormsModule`.
 * Checksley's registry itself is untouched and stays in effect for every not-yet-migrated
 * form. Same translation keys (`COMMON.FORM_ERRORS.*`), same `%s` positional placeholder
 * convention checksley used - `interpolate` below reproduces that substitution so the
 * *wording* users see doesn't change just because the validation engine underneath did.
 *
 * Only the first error on a control is surfaced, same as checksley's default single
 * error-per-field display (`onlyOneErrorElement` was the *opt-in* checksley option for
 * this - here it's simply how `getMessage` works, matching the majority of migrated forms'
 * original behavior).
 */
@Injectable({ providedIn: "root" })
export class FormErrorMessageService {
    constructor(@Inject(AJS_TRANSLATE) private translate: any) {}

    getMessage(errors: ValidationErrors | null | undefined): string | null {
        if (!errors) {
            return null;
        }

        const key = Object.keys(errors)[0];

        if (!key) {
            return null;
        }

        return this.messageFor(key, errors[key]);
    }

    private messageFor(key: string, errorValue: any): string {
        switch (key) {
            case "required":
                return this.translate.instant("COMMON.FORM_ERRORS.REQUIRED");
            case "email":
                return this.translate.instant("COMMON.FORM_ERRORS.TYPE_EMAIL");
            case "minlength":
                return this.interpolate("COMMON.FORM_ERRORS.MIN_LENGTH", errorValue.requiredLength);
            case "maxlength":
                return this.interpolate("COMMON.FORM_ERRORS.MAX_LENGTH", errorValue.requiredLength);
            case "linewidth":
                return this.interpolate("COMMON.FORM_ERRORS.LINEWIDTH", errorValue.width);
            case "pikaday":
                return this.translate.instant("COMMON.FORM_ERRORS.PIKADAY");
            case "strictUrl":
                return this.translate.instant("COMMON.FORM_ERRORS.TYPE_URLSTRICT");
            case "equalTo":
                return this.translate.instant("COMMON.FORM_ERRORS.EQUAL_TO");
            case "pattern":
                return this.translate.instant("COMMON.FORM_ERRORS.REGEXP");
            default:
                return this.translate.instant("COMMON.FORM_ERRORS.DEFAULT_MESSAGE");
        }
    }

    /** Substitutes `%s` placeholders positionally, same convention as checksley's own
     *  message templates (e.g. `"MIN_LENGTH": "... %s characters or more."`). */
    private interpolate(translationKey: string, ...args: any[]): string {
        const template = this.translate.instant(translationKey);
        let index = 0;

        return template.replace(/%s/g, () => `${args[index++]}`);
    }
}
