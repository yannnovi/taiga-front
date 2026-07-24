import { Component, ElementRef, Inject } from "@angular/core";
import { AJS_CONFIRM, AJS_CURRENT_USER_SERVICE, AJS_LIGHTBOX_SERVICE, AJS_RESOURCES } from "../shared/ajs-tokens";

declare const $: any;

/**
 * Angular replacement for the AngularJS `tgNewsletterEmailLightbox` directive
 * (app/modules/projects/create/newsletter-email-lightbox/), downgraded in place under the
 * same name.
 *
 * The original declared `scope: {visible, openNewsletter, onClose, onSelectUser}` but its
 * one real caller (`create-project.controller.coffee`'s `lightboxFactory.create(
 * "tg-newsletter-email-lightbox", {"class": "lightbox newsletter-email"})`) passes no
 * `scopeAttrs` at all - none of those four bindings are ever actually set. The directive
 * also had no `controller:` key despite its `link` function calling `ctrl.start()` on the
 * (nonexistent) 4th `link` argument - reachable only from the `vm.visible` watcher, which
 * itself never fires meaningfully since `vm` is never defined either. All of that is dead
 * code given the single real invocation and is not replicated here; only the genuinely
 * live behavior is kept: open on creation, the two checkboxes, cancel, and
 * save-preference (which calls `lightboxService.close(el)` directly, same as the
 * original's `closeLightbox` - unrelated to the dead `onClose` binding).
 *
 * Both resource calls (`setUserStorage`, `subscribeOnPremiseNewsletter`) used the
 * *smaller* `tgResources` aggregator in the original (`AJS_RESOURCES`, not
 * `AJS_TG_RESOURCES`) - kept as-is, verified both methods live there.
 */
@Component({
    selector: "tg-newsletter-email-lightbox",
    templateUrl: "./newsletter-email-lightbox.component.html",
})
export class NewsletterEmailLightboxComponent {
    dontAsk = false;
    preference = false;

    constructor(
        private elementRef: ElementRef,
        @Inject(AJS_LIGHTBOX_SERVICE) private lightboxService: any,
        @Inject(AJS_RESOURCES) private rs: any,
        @Inject(AJS_CURRENT_USER_SERVICE) private currentUserService: any,
        @Inject(AJS_CONFIRM) private confirm: any,
    ) {
        this.lightboxService.open($(this.elementRef.nativeElement));
    }

    closeLightbox(): void {
        this.lightboxService.close($(this.elementRef.nativeElement));
    }

    setEmail(): void {
        if (this.preference) {
            this.rs.onPremise
                .subscribeOnPremiseNewsletter({
                    email: this.currentUserService.getUser().get("email"),
                    full_name: this.currentUserService.getUser().get("full_name"),
                    origin_form: "Newsletter sign-up create",
                })
                .then(() => {
                    this.rs.user.setUserStorage("dont_ask_premise_newsletter", true);
                    this.closeLightbox();
                })
                .catch(() => {
                    this.confirm.notify("light-error", "");
                });
        } else {
            this.rs.user.setUserStorage("dont_ask_premise_newsletter", this.dontAsk);
            this.closeLightbox();
        }
    }
}
