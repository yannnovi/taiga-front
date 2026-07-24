import { Component, Inject, Input } from "@angular/core";
import { AJS_LIGHTBOX_FACTORY } from "../shared/ajs-tokens";

/**
 * Angular replacement for the AngularJS `tgContactProjectButton` directive
 * (app/modules/projects/components/contact-project-button/), downgraded in place under the
 * same name.
 */
@Component({
    selector: "tg-contact-project-button",
    templateUrl: "./contact-project-button.component.html",
})
export class ContactProjectButtonComponent {
    @Input() project: any;
    @Input() layout: string | undefined;

    constructor(@Inject(AJS_LIGHTBOX_FACTORY) private lightboxFactory: any) {}

    launchContactForm(): void {
        this.lightboxFactory.create(
            "tg-lb-contact-project",
            { class: "lightbox lightbox-contact-project e2e-lightbox-contact-project", "bind-project": "project" },
            { project: this.project },
        );
    }
}
