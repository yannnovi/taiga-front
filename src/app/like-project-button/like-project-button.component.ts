import { Component, Inject, Input } from "@angular/core";
import { AJS_CONFIRM, AJS_LIKE_PROJECT_BUTTON_SERVICE } from "../shared/ajs-tokens";

declare const window: any;

/**
 * Angular replacement for the AngularJS `tgLikeProjectButton` directive
 * (app/modules/projects/components/like-project-button/), downgraded in place under the
 * same name. `tg-loading` (a template-less directive that temporarily swaps its target's
 * content for a spinner, same family as tg-avatar/tg-loading elsewhere in this migration)
 * is replicated with a plain `*ngIf`/`else` toggle on the counter.
 */
@Component({
    selector: "tg-like-project-button",
    templateUrl: "./like-project-button.component.html",
})
export class LikeProjectButtonComponent {
    @Input() project: any;

    isMouseOver = false;
    loading = false;
    spinnerSrc = `${window._version}/svg/spinner-circle.svg`;

    constructor(
        @Inject(AJS_CONFIRM) private confirm: any,
        @Inject(AJS_LIKE_PROJECT_BUTTON_SERVICE) private likeButtonService: any,
    ) {}

    showTextWhenMouseIsOver(): void {
        this.isMouseOver = true;
    }

    showTextWhenMouseIsLeave(): void {
        this.isMouseOver = false;
    }

    toggleLike(): void {
        this.loading = true;

        const promise = this.project.get("is_fan") ? this.unlike() : this.like();

        promise.finally(() => {
            this.loading = false;
        });
    }

    private like(): any {
        return this.likeButtonService
            .like(this.project.get("id"))
            .then(() => this.showTextWhenMouseIsLeave())
            .catch(() => this.confirm.notify("error"));
    }

    private unlike(): any {
        return this.likeButtonService.unlike(this.project.get("id")).catch(() => this.confirm.notify("error"));
    }
}
