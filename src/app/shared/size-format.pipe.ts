import { Pipe, PipeTransform } from "@angular/core";

declare const taiga: any;

/**
 * Angular equivalent of the AngularJS `{{ x | sizeFormat }}` filter
 * (app/coffee/modules/common/filters.coffee), a thin wrapper over the global
 * `taiga.sizeFormat` helper (app/coffee/utils.coffee).
 */
@Pipe({ name: "tgSizeFormat" })
export class TgSizeFormatPipe implements PipeTransform {
    transform(input: number): string {
        return taiga.sizeFormat(input);
    }
}
