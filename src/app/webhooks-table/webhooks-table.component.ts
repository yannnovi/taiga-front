import { Component, Inject, Input, OnChanges } from "@angular/core";
import { FormArray, FormControl, FormGroup, Validators } from "@angular/forms";
import { AJS_ANALYTICS, AJS_CONFIRM, AJS_REPO, AJS_TG_RESOURCES, AJS_TRANSLATE } from "../shared/ajs-tokens";
import { strictUrlValidator } from "../shared/checksley-validators";
import { FormErrorMessageService } from "../shared/form-error-message.service";

declare const moment: any;

/**
 * Angular replacement for the AngularJS `tgWebhook`/`tgNewWebhook` directives
 * (app/coffee/modules/admin/third-parties.coffee) - the project "Webhooks" admin page's
 * full CRUD (name/URL/secret key, add/edit/delete) plus a per-webhook request/response log
 * history (test, view, resend). `WebhooksController` (data loading) is untouched.
 *
 * All 3 fields (`name`/`url`/`key`) were required on both the new-row and an existing row -
 * no asymmetry here, unlike `points`/due-dates elsewhere in this sub-project. `url`'s
 * `data-type="url"` mapped to checksley's *overridden* stricter `url` validator (see
 * `checksley-validators.ts`), not its lenient built-in - reproduced with the shared
 * `strictUrlValidator`.
 *
 * Worth calling out because it's easy to "fix" without noticing: the original never shows a
 * success toast anywhere in this whole feature (create, edit, or delete) - only failures
 * call `$confirm.notify("error", ...)`. Visual feedback on success is the form/edit-mode
 * closing or the row appearing/disappearing, nothing else. Reproduced as-is.
 *
 * The original's history panel used jQuery's `.slideToggle()` for an open/close animation;
 * here it's a plain `*ngIf`/class toggle - same simplification already used elsewhere in
 * this migration for jQuery-driven visual effects with no behavioural weight.
 *
 * Layout note: the original's "Add new webhook" button lived in the *route's* own
 * `header.header-with-actions`, next to `mainTitle` (a still-AngularJS directive) - sharing
 * one flex row. Since that button's visibility/click both depend on this component's own
 * state (`showAddForm`/`webhooks.length`), and there's no channel for a still-AngularJS
 * template to call a method on a downgraded component, the button now lives inside this
 * component's own template instead, right above the table rather than beside the page
 * title. A one-line visual difference, not a functional one.
 */
@Component({
    selector: "tg-webhooks-table",
    templateUrl: "./webhooks-table.component.html",
})
export class WebhooksTableComponent implements OnChanges {
    @Input() project: any;

    webhooks: any[] = [];
    webhooksForm = new FormArray<FormGroup>([]);
    newWebhookForm!: FormGroup;
    showAddForm = false;
    submittingNew = false;

    private lastProjectId: any;

    constructor(
        @Inject(AJS_TG_RESOURCES) private rs: any,
        @Inject(AJS_REPO) private repo: any,
        @Inject(AJS_CONFIRM) private confirm: any,
        @Inject(AJS_ANALYTICS) private analytics: any,
        @Inject(AJS_TRANSLATE) private translate: any,
        public errors: FormErrorMessageService,
    ) {
        this.resetNewWebhookForm();
    }

    ngOnChanges(): void {
        if (this.project?.id && this.project.id !== this.lastProjectId) {
            this.lastProjectId = this.project.id;
            this.loadWebhooks();
        }
    }

    trackById(_index: number, webhook: any): any {
        return webhook.id;
    }

    private resetNewWebhookForm(): void {
        this.newWebhookForm = new FormGroup({
            name: new FormControl("", Validators.required),
            url: new FormControl("", [Validators.required, strictUrlValidator()]),
            key: new FormControl("", Validators.required),
        });
    }

    private loadWebhooks(): void {
        this.rs.webhooks.list(this.project.id).then((webhooks: any[]) => {
            this.webhooks = webhooks;
            this.webhooksForm = new FormArray<FormGroup>(webhooks.map((w) => this.buildRowGroup(w)));
            this.showAddForm = webhooks.length === 0;
        });
    }

    private buildRowGroup(webhook: any): FormGroup {
        return new FormGroup({
            name: new FormControl(webhook.name, Validators.required),
            url: new FormControl(webhook.url, [Validators.required, strictUrlValidator()]),
            key: new FormControl(webhook.key, Validators.required),
        });
    }

    startEdit(webhook: any): void {
        webhook.editing = true;
    }

    cancelEdit(webhook: any, index: number): void {
        webhook.editing = false;
        webhook.revert();
        this.webhooksForm.setControl(index, this.buildRowGroup(webhook));
    }

    save(webhook: any, index: number): void {
        const group = this.webhooksForm.at(index);

        if (group.invalid) {
            group.markAllAsTouched();
            return;
        }

        Object.assign(webhook, group.value);

        this.repo.save(webhook).then(
            () => {
                webhook.editing = false;
            },
            () => {
                this.confirm.notify("error");
            },
        );
    }

    showAdd(): void {
        this.showAddForm = true;
    }

    cancelAdd(): void {
        this.resetNewWebhookForm();

        if (this.webhooks.length) {
            this.showAddForm = false;
        }
    }

    addNew(): void {
        if (this.submittingNew) {
            return;
        }

        if (this.newWebhookForm.invalid) {
            this.newWebhookForm.markAllAsTouched();
            return;
        }

        const payload = { ...this.newWebhookForm.value, project: this.project.id };

        this.submittingNew = true;

        this.repo.create("webhooks", payload).then(
            (data: any) => {
                this.submittingNew = false;
                this.analytics.trackEvent("webhooks", "create", "Create new webhook", 1);
                this.webhooks.push(data);
                this.webhooksForm.push(this.buildRowGroup(data));
                this.resetNewWebhookForm();
                this.showAddForm = false;
            },
            () => {
                this.submittingNew = false;
                this.confirm.notify("error");
            },
        );
    }

    deleteWebhook(webhook: any): void {
        const title = this.translate.instant("ADMIN.WEBHOOKS.DELETE");
        const message = this.translate.instant("ADMIN.WEBHOOKS.WEBHOOK_NAME", { name: webhook.name });

        this.confirm.askOnDelete(title, message).then((response: any) => {
            this.repo.remove(webhook).then(
                () => {
                    this.loadWebhooks();
                    response.finish();
                },
                () => {
                    response.finish(false);
                    this.confirm.notify("error");
                },
            );
        });
    }

    testWebhook(webhook: any): void {
        webhook.historyOpen = true;

        this.rs.webhooks.test(webhook.id).then(() => {
            this.loadLogs(webhook);
        });
    }

    toggleHistory(webhook: any): void {
        if (!webhook.logs?.length) {
            this.loadLogs(webhook).then(() => {
                webhook.historyOpen = true;
            });
        } else {
            webhook.historyOpen = !webhook.historyOpen;
        }
    }

    private loadLogs(webhook: any): Promise<any> {
        return this.rs.webhooklogs.list(webhook.id).then((logs: any[]) => {
            const prettyDateFormat = this.translate.instant("ADMIN.WEBHOOKS.DATE");

            logs.forEach((log) => {
                log.validStatus = log.status >= 200 && log.status < 300;
                log.prettySentHeaders = Object.entries(log.request_headers || {})
                    .map(([header, value]) => `${header}: ${value}`)
                    .join("\n");
                log.prettySentData = JSON.stringify(log.request_data);
                log.prettyDate = moment(log.created).format(prettyDateFormat);
            });

            webhook.logs_counter = logs.length;
            webhook.logs = logs;
        });
    }

    toggleLogDetail(log: any): void {
        log.detailOpen = !log.detailOpen;
    }

    resendLog(webhook: any, log: any): void {
        this.rs.webhooklogs.resend(log.id).then(() => {
            this.loadLogs(webhook);
        });
    }
}
