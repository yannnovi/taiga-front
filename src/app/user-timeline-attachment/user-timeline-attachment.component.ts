import { Component, Input, OnChanges } from "@angular/core";

const VALID_FILE_EXTENSIONS = [".jpg", ".jpeg", ".bmp", ".gif", ".png"];

/**
 * Angular replacement for the AngularJS `tgUserTimelineAttachment` directive
 * (app/modules/user-timeline/user-timeline-attachment/), downgraded in place under the
 * same name. The original picked between two templates at link time via `$compile` +
 * `$tgTemplate.get(...)` depending on whether the attachment is an image - Angular does
 * this natively with `*ngIf`/`*ngIf; else`, no manual compile step needed.
 *
 * Faithful to the original's `isImage()`, bug and all: `url.indexOf(extension, url -
 * extension.length)` subtracts a number from a string, which is `NaN`, and `indexOf`
 * treats a `NaN` fromIndex as `0` - so despite reading like an "ends with" check, it
 * actually just checks whether the extension appears *anywhere* in the url. Replicated as
 * plain `.includes()`, matching the actual (not the seemingly intended) behavior.
 */
@Component({
    selector: "tg-user-timeline-attachment",
    templateUrl: "./user-timeline-attachment.component.html",
})
export class UserTimelineAttachmentComponent implements OnChanges {
    @Input() attachment: any;

    isImage = false;

    ngOnChanges(): void {
        const url: string = this.attachment.get("url").toLowerCase();
        this.isImage = VALID_FILE_EXTENSIONS.some((extension) => url.includes(extension));
    }
}
