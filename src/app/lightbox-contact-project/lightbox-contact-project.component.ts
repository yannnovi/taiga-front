import { Component, ElementRef, Inject, Input } from "@angular/core";
import { AJS_CONFIRM, AJS_LIGHTBOX_SERVICE, AJS_PROJECT_LOGO_SERVICE, AJS_RESOURCES } from "../shared/ajs-tokens";

declare const Immutable: any;
declare const window: any;
declare const $: any;

/**
 * Angular replacement for the AngularJS `tgLbContactProject` directive
 * (app/modules/projects/components/lb-contact-project/), downgraded in place under the
 * same name - the lightbox opened by the already-migrated `ContactProjectButtonComponent`.
 * That caller's `lightboxFactory.create` attrs switch from plain `project` to
 * `bind-project` now that the target is a downgraded component.
 *
 * The original had no `scope: {}` at all alongside `bindToController: {project: '='}` -
 * an unusual but working combination (same underlying mechanism already proven by
 * `move-to-sprint`'s lightbox).
 *
 * The original template's first `img` branch (`ng-if="vm.project.logo_big_url"`,
 * `ng-src="vm.project.logo_big_url"`) read a plain property directly off an Immutable Map
 * (`project` is Immutable everywhere else, always accessed via `.get(...)`) - `.logo_big_url`
 * on an Immutable Map is always `undefined`, so that branch was always dead; only the
 * `tg-project-logo-big-src` fallback branch (template-less, replicated inline via
 * `tgProjectLogoService`) ever actually rendered. Simplified to just that one branch,
 * faithful to the original's actual (buggy) behavior rather than its apparent intent.
 *
 * The original's `link` called `lightboxService.open(el)` directly (it's what actually
 * makes the lightbox visible - adds the `.open` class and sets `display: flex`); replicated
 * here in the constructor, same as `NewsletterEmailLightboxComponent`.
 */
@Component({
    selector: "tg-lb-contact-project",
    templateUrl: "./lightbox-contact-project.component.html",
})
export class LightboxContactProjectComponent {
    @Input() project: any;

    contact: { message?: string } = {};
    sendingFeedback = false;
    spinnerSrc = `${window._version}/svg/spinner-circle.svg`;

    constructor(
        private elementRef: ElementRef,
        @Inject(AJS_LIGHTBOX_SERVICE) private lightboxService: any,
        @Inject(AJS_RESOURCES) private rs: any,
        @Inject(AJS_CONFIRM) private confirm: any,
        @Inject(AJS_PROJECT_LOGO_SERVICE) private projectLogoService: any,
    ) {
        this.lightboxService.open($(this.elementRef.nativeElement));
    }

    getLogoUrl(): string {
        const project = Immutable.fromJS(this.project);
        const logoUrl = project.get("logo_big_url");

        if (logoUrl) {
            return logoUrl;
        }

        return this.projectLogoService.getDefaultProjectLogo(project.get("slug"), project.get("id")).src;
    }

    getLogoBg(): string {
        const project = Immutable.fromJS(this.project);

        if (project.get("logo_big_url")) {
            return "";
        }

        return this.projectLogoService.getDefaultProjectLogo(project.get("slug"), project.get("id")).color;
    }

    contactProject(): void {
        const projectId = this.project.get("id");
        const message = this.contact.message;

        this.sendingFeedback = true;

        this.rs.projects.contactProject(projectId, message).then(() => {
            this.lightboxService.closeAll();
            this.sendingFeedback = false;
            this.confirm.notify("success");
        });
    }
}
