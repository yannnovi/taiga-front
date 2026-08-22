import { AbstractControl, ValidationErrors, ValidatorFn } from "@angular/forms";

declare const taiga: any;
declare const moment: any;

/**
 * Angular `ValidatorFn` equivalents of checksley's three custom validators
 * (`app/coffee/app.coffee`'s `init()`, `checksley.updateValidators(...)`) - checksley
 * itself stays registered and in use by every not-yet-migrated form; these are only for
 * forms already converted to `ReactiveFormsModule`. Error keys are deliberately distinct
 * from checksley's own message-registry keys where Angular already has a same-named
 * built-in (`url` is Angular's own, lenient `Validators.pattern`-style check for the
 * `type=url` case - this file's `strictUrl` is checksley's *stricter* `data-type="url"`
 * validator, a different rule with its own message key, see `form-error-message.service.ts`).
 */

/** Mirrors `linewidth(val, width)`: every line (after `nl2br`, i.e. after `\n` becomes
 *  `<br />` - same as the original, `taiga.nl2br` is the same global utility) must be
 *  under `width` characters. */
export function linewidthValidator(width: number): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        if (!control.value) {
            return null;
        }

        const lines = taiga.nl2br(control.value).split("<br />");
        const valid = lines.every((line: string) => line.length < width);

        return valid ? null : { linewidth: { width } };
    };
}

/** Mirrors `pikaday(val)`: validates against the locale's "pretty date" format
 *  (`COMMON.PICKERDATE.FORMAT`, e.g. `"DD MMM YYYY"`) via moment - the caller resolves the
 *  translated format string once (`AJS_TRANSLATE`) and passes it in, since a `ValidatorFn`
 *  factory has no DI of its own. */
export function pikadayValidator(prettyDateFormat: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
        if (!control.value) {
            return null;
        }

        return moment(control.value, prettyDateFormat).isValid() ? null : { pikaday: true };
    };
}

/** Mirrors the original's `url(val)` custom validator - a stricter/different regex than
 *  checksley's own built-in `type=url` check, ported verbatim. */
export function strictUrlValidator(): ValidatorFn {
    // eslint-disable-next-line no-useless-escape
    const re = new RegExp(
        "^" +
            "(?:(?:https?|ftp)://)" +
            "(?:\\S+(?::\\S*)?@)?" +
            "(?:" +
            "(?!(?:10|127)(?:\\.\\d{1,3}){3})" +
            "(?!(?:169\\.254|192\\.168)(?:\\.\\d{1,3}){2})" +
            "(?!172\\.(?:1[6-9]|2\\d|3[0-1])(?:\\.\\d{1,3}){2})" +
            "(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])" +
            "(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}" +
            "(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))" +
            "|" +
            "(?:(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)" +
            "(?:\\.(?:[a-z\\u00a1-\\uffff0-9]-*)*[a-z\\u00a1-\\uffff0-9]+)*" +
            "(?:\\.(?:[a-z\\u00a1-\\uffff]{2,}))" +
            "\\.?" +
            ")" +
            "(?::\\d{2,5})?" +
            "(?:[/?#]\\S*)?" +
            "$",
        "i",
    );

    return (control: AbstractControl): ValidationErrors | null => {
        if (!control.value) {
            return null;
        }

        return re.test(control.value) ? null : { strictUrl: true };
    };
}

/** Mirrors checksley's `equalto` (`data-equalto="#otherField"`, e.g. password
 *  confirmation) - a cross-field validator applied at the `FormGroup` level, comparing two
 *  named controls. */
export function equalToValidator(controlName: string, otherControlName: string): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
        const control = group.get(controlName);
        const other = group.get(otherControlName);

        if (!control || !other || control.value === other.value) {
            return null;
        }

        return { equalTo: true };
    };
}
