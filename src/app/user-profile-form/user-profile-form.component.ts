import { Component, EventEmitter, Inject, Input, OnChanges, Output } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import { AJS_AUTH, AJS_CONFIRM, AJS_REPO, AJS_ROOT_SCOPE, AJS_TRANSLATE } from "../shared/ajs-tokens";
import { FormErrorMessageService } from "../shared/form-error-message.service";

declare const window: any;

/**
 * Angular replacement for the AngularJS `tgUserProfile` directive
 * (app/coffee/modules/user-settings/main.coffee) - the user profile edit form
 * (`user-profile.jade`). `UserSettingsController` (route data loading) is untouched, minus
 * `verifyEmail`/`exportProfile`/`openDeleteLightbox`, absorbed here since this template was
 * their only caller.
 *
 * `username` (required, 255 chars, `data-regexp="^[\w.-]+$"`), `email` (required, 255
 * chars, `data-type="email"`), `full_name` (required, 256 chars) and `bio` (`ng-maxlength`,
 * not even checksley) were the only validated fields - reproduced with `Validators.pattern`/
 * `Validators.email`/`Validators.maxLength`. `lang`/`theme` were never checksley-validated
 * either and live on `$scope` directly rather than on `user` (merged onto it only at submit
 * time in the original) - kept as plain local fields here, seeded once from the
 * controller's own `getLan()`/`getTheme()` computation via `@Input()`.
 *
 * `<tg-user-avatar>` (absorbs `tgUserAvatar`/`tgAvatarModel`, see that component) and
 * `tg-avatar-big` (still AngularJS, wrapped via `UpgradeComponent` - shared with many other
 * not-yet-migrated callers) are embedded directly in this component's template, same as
 * `ProjectLogoComponent` inside `AdminProjectProfileFormComponent`.
 *
 * `UserSettingsController#maxFileSizeMsg` (computed from config, never referenced by
 * `user-profile.jade`) is pre-existing dead code - not carried over as an `@Input()`.
 */
@Component({
    selector: "tg-user-profile-form",
    templateUrl: "./user-profile-form.component.html",
})
export class UserProfileFormComponent implements OnChanges {
    @Input() user: any;
    @Input() lang: any;
    @Input() theme: any;
    @Input() locales: any[] = [];
    @Input() availableThemes: string[] = [];

    @Output() userChange = new EventEmitter<any>();

    form = new FormGroup({
        username: new FormControl("", [Validators.required, Validators.maxLength(255), Validators.pattern(/^[\w.-]+$/)]),
        email: new FormControl("", [Validators.required, Validators.maxLength(255), Validators.email]),
        full_name: new FormControl("", [Validators.required, Validators.maxLength(256)]),
        bio: new FormControl("", Validators.maxLength(210)),
    });

    localLang: any;
    localTheme: any;
    submitting = false;

    private lastUserId: any;
    private langThemeInitialized = false;

    constructor(
        @Inject(AJS_REPO) private repo: any,
        @Inject(AJS_AUTH) private auth: any,
        @Inject(AJS_CONFIRM) private confirm: any,
        @Inject(AJS_TRANSLATE) private translate: any,
        @Inject(AJS_ROOT_SCOPE) private rootScope: any,
        public errors: FormErrorMessageService,
    ) {}

    ngOnChanges(): void {
        if (this.user?.id && this.user.id !== this.lastUserId) {
            this.lastUserId = this.user.id;
            this.form.patchValue({
                username: this.user.username,
                email: this.user.email,
                full_name: this.user.full_name,
                bio: this.user.bio,
            });
        }

        if (!this.langThemeInitialized && (this.lang !== undefined || this.theme !== undefined)) {
            this.langThemeInitialized = true;
            this.localLang = this.lang;
            this.localTheme = this.theme;
        }
    }

    onAvatarChange(user: any): void {
        this.user = user;
        this.userChange.emit(user);
    }

    verifyEmail(): void {
        this.auth.sendVerificationEmail().then(
            () => {
                this.confirm.notify("success", this.translate.instant("USER_PROFILE.VERIFY_EMAIL_SUCCESS"));
            },
            (response: any) => {
                if (response.data?._error_message) {
                    this.confirm.notify("error", response.data._error_message);
                }
            },
        );
    }

    exportProfile(): void {
        this.auth.exportProfile().then(
            (result: any) => {
                window.open(result.data.url, "_blank");
            },
            (response: any) => {
                if (response.data?._error_message) {
                    this.confirm.notify("error", response.data._error_message);
                }
            },
        );
    }

    openDeleteLightbox(): void {
        this.rootScope.$broadcast("deletelightbox:new", this.user);
    }

    submit(): void {
        if (this.submitting || this.form.invalid) {
            this.form.markAllAsTouched();
            return;
        }

        this.submitting = true;

        const changeEmail = this.user.isAttributeModified("email");

        Object.assign(this.user, this.form.value);
        this.user.lang = this.localLang;
        this.user.theme = this.localTheme;

        this.repo.save(this.user).then(
            (data: any) => {
                this.submitting = false;
                this.auth.setUser(data);
                this.userChange.emit(data);

                if (changeEmail) {
                    this.confirm.success(this.translate.instant("USER_PROFILE.CHANGE_EMAIL_SUCCESS"));
                } else {
                    this.confirm.notify("success");
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
