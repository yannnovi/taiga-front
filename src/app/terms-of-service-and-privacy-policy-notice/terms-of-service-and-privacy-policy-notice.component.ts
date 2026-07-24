import { Component, EventEmitter, Inject, Input, OnInit, Output } from "@angular/core";
import { AJS_CONFIG } from "../shared/ajs-tokens";

/**
 * Angular replacement for the AngularJS `tgTermsOfServiceAndPrivacyPolicyNotice` directive
 * (app/modules/components/terms-of-service-and-privacy-policy-notice/), downgraded in
 * place under the same name. `target` was a real two-way `"="` binding (the checkbox
 * writes into it) - kept as a genuine Angular two-way binding
 * (`@Input() target` + `@Output() targetChange`), both callers switch to the
 * `bindon-target` banana-box convention, same as board-zoom/swimlane-selector.
 */
@Component({
    selector: "tg-terms-of-service-and-privacy-policy-notice",
    templateUrl: "./terms-of-service-and-privacy-policy-notice.component.html",
})
export class TermsOfServiceAndPrivacyPolicyNoticeComponent implements OnInit {
    @Input() target: boolean | undefined;
    @Output() targetChange = new EventEmitter<boolean>();

    privacyPolicyUrl: string | undefined;
    termsOfServiceUrl: string | undefined;

    constructor(@Inject(AJS_CONFIG) private config: any) {}

    ngOnInit(): void {
        this.privacyPolicyUrl = this.config.get("privacyPolicyUrl");
        this.termsOfServiceUrl = this.config.get("termsOfServiceUrl");

        if (!this.privacyPolicyUrl || !this.termsOfServiceUrl) {
            this.targetChange.emit(true);
        }
    }

    onAcceptedTermsChange(event: Event): void {
        this.targetChange.emit((event.target as HTMLInputElement).checked);
    }
}
