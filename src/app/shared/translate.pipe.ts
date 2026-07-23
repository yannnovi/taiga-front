import { Inject, Pipe, PipeTransform } from "@angular/core";
import { AJS_TRANSLATE } from "./ajs-tokens";

/**
 * Angular equivalent of the AngularJS `{{ key | translate }}` filter (angular-translate).
 * By the time a migrated component renders, the route's `languageLoad` resolve (see
 * app/coffee/app.coffee) has already awaited translation loading, so the synchronous
 * `$translate.instant()` API is safe to use here.
 */
@Pipe({ name: "tgTranslate" })
export class TgTranslatePipe implements PipeTransform {
    constructor(@Inject(AJS_TRANSLATE) private translate: any) {}

    transform(key: string, values?: Record<string, any>, interpolationId?: string): string {
        return this.translate.instant(key, values, interpolationId);
    }
}
