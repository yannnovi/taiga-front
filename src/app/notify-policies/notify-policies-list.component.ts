import { Component, Inject, Input } from "@angular/core";
import { AJS_CONFIRM, AJS_REPO } from "../shared/ajs-tokens";

/**
 * Was `tgUserNotificationsList` / `tgUserLiveNotificationsList` /
 * `tgUserWebNotificationsList` (`user-settings/{notifications,live-notifications,
 * web-notifications}.coffee`): the per-project notification policy rows of the three user
 * settings pages. The originals read `$scope.notifyPolicies` ambiently (bindOnce) and
 * rebuilt rows from a lodash template. One component, `mode` picks the field:
 * - `mail` -> `notify_level` (2 all / 1 involved / 3 none),
 * - `live` -> `live_notify_level` (same levels),
 * - `web`  -> `web_notify_level` (boolean yes/no switch).
 * Each change saves the policy model through `$tgRepo`; a failed radio change goes back to
 * the previous level, as before.
 */
@Component({
    selector: "tg-notify-policies-list",
    template: `
        <div class="policy-table-row" *ngFor="let policy of policies; trackBy: trackById">
            <div class="policy-table-project"><span>{{ policy.project_name }}</span></div>

            <ng-container *ngIf="mode !== 'web'">
                <div *ngFor="let level of levels" [class]="level.cls">
                    <div class="button-check">
                        <input
                            type="radio"
                            [name]="'policy-' + policy.id"
                            [id]="'policy-' + level.key + '-' + policy.id"
                            [value]="level.value"
                            [checked]="policy[field] === level.value"
                            (change)="setLevel(policy, level.value)"
                        />
                        <label [attr.for]="'policy-' + level.key + '-' + policy.id">{{ level.label | tgTranslate }}</label>
                    </div>
                </div>
            </ng-container>

            <div class="policy-table-all" *ngIf="mode === 'web'">
                <div class="check" (click)="toggleWeb(policy)">
                    <input type="checkbox" [checked]="!!policy.web_notify_level" [name]="'policy-' + policy.id" [id]="'policy-' + policy.id" />
                    <div></div>
                    <span class="check-text check-yes">{{ "COMMON.YES" | tgTranslate }}</span>
                    <span class="check-text check-no">{{ "COMMON.NO" | tgTranslate }}</span>
                </div>
            </div>
        </div>
    `,
})
export class NotifyPoliciesListComponent {
    @Input() policies: any[] = [];
    /** "mail" | "live" | "web" */
    @Input() mode: string;

    readonly levels = [
        { key: "all", value: 2, cls: "policy-table-all", label: "USER_SETTINGS.NOTIFICATIONS.OPTION_ALL" },
        { key: "involved", value: 1, cls: "policy-table-involved", label: "USER_SETTINGS.NOTIFICATIONS.OPTION_INVOLVED" },
        { key: "none", value: 3, cls: "policy-table-none", label: "USER_SETTINGS.NOTIFICATIONS.OPTION_NONE" },
    ];

    constructor(
        @Inject(AJS_REPO) private repo: any,
        @Inject(AJS_CONFIRM) private confirm: any,
    ) {}

    get field(): string {
        return this.mode === "live" ? "live_notify_level" : "notify_level";
    }

    trackById(_index: number, policy: any): any {
        return policy.id;
    }

    setLevel(policy: any, level: number): void {
        const field = this.field;
        const previous = policy[field];
        policy[field] = level;

        this.repo.save(policy).then(
            () => this.confirm.notify("success"),
            () => {
                this.confirm.notify("error");
                policy[field] = previous;
            },
        );
    }

    toggleWeb(policy: any): void {
        const previous = policy.web_notify_level;
        policy.web_notify_level = !previous;

        this.repo.save(policy).then(
            () => this.confirm.notify("success"),
            () => {
                this.confirm.notify("error");
                policy.web_notify_level = previous;
            },
        );
    }
}
