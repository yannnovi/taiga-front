import { Pipe, PipeTransform } from "@angular/core";

declare const moment: any;

/**
 * Angular equivalent of the AngularJS `{{ x | momentFormat:'FORMAT' }}` filter
 * (app/coffee/modules/common/filters.coffee) - `moment` is already a global (loaded via
 * libs.js), same as `_`/`Immutable`/`taiga` elsewhere in this migration.
 */
@Pipe({ name: "tgMomentFormat" })
export class TgMomentFormatPipe implements PipeTransform {
    transform(input: any, format: string): string {
        if (!input) {
            return "";
        }

        return moment(input).format(format);
    }
}
