import { Component, ElementRef, EventEmitter, Inject, Input, Output, ViewChild } from "@angular/core";
import { AJS_ANALYTICS, AJS_CONFIRM, AJS_REPO, AJS_TRANSLATE } from "../shared/ajs-tokens";

/**
 * Angular replacement for the AngularJS `tgGithubWebhooks`/`tgGitlabWebhooks`/
 * `tgBitbucketWebhooks`/`tgGogsWebhooks` directives (app/coffee/modules/admin/
 * third-parties.coffee) - the 4 git-provider integration settings forms, downgraded in
 * place under one shared selector rather than 4 near-identical ones. None of the 4
 * originals had any real checksley validation (`form.checksley(...)` was called, but no
 * field in any of the 4 templates ever carried a `data-required`/`data-type` attribute) -
 * no `FormGroup`/`Validators` needed here, just plain `ngModel` on `module`'s fields.
 *
 * `hasValidOriginIps` gates the one field that differs between providers (gitlab/bitbucket
 * have it, github/gogs don't) - `valid_origin_ips` is an array API-side; the original's
 * `tgValidOriginIps` directive (a `$ngModel` `$parsers` push, comma-string -> array) is
 * reproduced here as a plain getter/setter pair on the text the input actually displays.
 *
 * `reload` is only emitted for providers whose controller actually listens for it - the
 * original's `$scope.$emit("project:modules:reload")` was present in the gitlab/bitbucket/
 * gogs directives' success handlers but not github's (`GithubController`'s constructor
 * never subscribes to it either) - reproduced as the same asymmetry rather than "fixed" to
 * always reload.
 *
 * `copyPayloadUrl` absorbs the AngularJS `tgSelectInputText` directive's behaviour
 * (`common.coffee`/`third-parties.coffee`) for this one field - that directive itself stays
 * registered and active, still used by `project-csv.jade` (out of scope here).
 */
@Component({
    selector: "tg-third-party-webhook-form",
    templateUrl: "./third-party-webhook-form.component.html",
})
export class ThirdPartyWebhookFormComponent {
    @Input() module: any;
    @Input() provider!: "github" | "gitlab" | "bitbucket" | "gogs";
    @Input() hasValidOriginIps = false;
    @Input() validOriginIpsPlaceholderKey = "";
    @Input() helpUrl = "";

    @Output() reload = new EventEmitter<void>();

    @ViewChild("payloadUrlInput") payloadUrlInputRef: ElementRef<HTMLInputElement> | undefined;

    submitting = false;

    constructor(
        @Inject(AJS_REPO) private repo: any,
        @Inject(AJS_CONFIRM) private confirm: any,
        @Inject(AJS_ANALYTICS) private analytics: any,
        @Inject(AJS_TRANSLATE) private translate: any,
    ) {}

    copyPayloadUrl(): void {
        const input = this.payloadUrlInputRef?.nativeElement;

        if (!input?.value) {
            return;
        }

        input.select();
        document.execCommand("copy");
        this.confirm.notify("success", this.translate.instant("COMMON.COPIED_TO_CLIPBOARD"));
    }

    get validOriginIpsText(): string {
        return (this.module?.valid_origin_ips || []).join(",");
    }

    set validOriginIpsText(value: string) {
        const trimmed = (value || "").trim();
        this.module.valid_origin_ips = trimmed === "" ? [] : trimmed.split(",");
    }

    submit(): void {
        if (this.submitting) {
            return;
        }

        this.submitting = true;

        this.repo.saveAttribute(this.module, this.provider).then(
            () => {
                this.submitting = false;
                this.analytics.trackEvent(
                    `${this.provider}-webhook`,
                    "created-or-changed",
                    `Create or changed ${this.provider} webhook`,
                    1,
                );
                this.confirm.notify("success");

                if (this.provider !== "github") {
                    this.reload.emit();
                }
            },
            (data: any) => {
                this.submitting = false;

                if (data?._error_message) {
                    this.confirm.notify("error", data._error_message);
                }
            },
        );
    }
}
