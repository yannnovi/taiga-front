import { Component, Inject, OnInit } from "@angular/core";
import { FormControl, FormGroup, Validators } from "@angular/forms";
import {
    AJS_ANALYTICS,
    AJS_AUTH,
    AJS_AVATAR_SERVICE,
    AJS_CONFIG,
    AJS_CONFIRM,
    AJS_NAV_URLS,
    AJS_ROOT_SCOPE,
    AJS_ROUTE_PARAMS,
    AJS_TG_LOCATION,
    AJS_TRANSLATE,
} from "../shared/ajs-tokens";
import { FormErrorMessageService } from "../shared/form-error-message.service";

/**
 * Angular replacement for the AngularJS `tgInvitation` directive
 * (app/coffee/modules/auth.coffee), downgraded in place under the same name, replacing
 * `.centered.invitation-container(tg-invitation)` entirely - the invited-by header (avatar
 * + name), the login form, and the register form all shared one ambient AngularJS scope
 * in the original, so absorbing the whole subtree into one component (rather than
 * splitting it across an Angular/AngularJS boundary) avoids that ambient-scope-sharing
 * problem entirely, same reasoning as `UserAvatarComponent`'s siblings in sous-projet 4g.
 *
 * `tg-avatar="invitation.invited_by"` (the same template-less `AvatarDirective` as
 * `tg-avatar-big`, just the "avatar" size) replicated via `tgAvatarService.getAvatar(...)`
 * directly rather than wrapped, per the finding in MIGRATION.md sous-projet 4g -
 * `UpgradeComponent` cannot wrap it either way. `tg-bo-title`/`tg-bo-alt`/`tg-bo-bind`
 * (bind-once helpers, app/coffee/modules/base/bind.coffee) replaced with plain
 * interpolation/property binding - Angular's change detection needs no such optimization.
 *
 * `tg-capslock` on both password fields was already dead in the original (no
 * `ng-focus`/`ng-keyup` ever set the flags here, unlike `tgLogin`) - not reproduced.
 * `$scope.publicRegisterEnabled` was computed but never referenced by any template
 * (confirmed by grep) - dropped as dead code, same class of finding as
 * `UserProfileFormComponent`'s `maxFileSizeMsg`. The register sub-form's password field
 * has no `minlength` constraint, unlike the standalone `tg-register-form`'s (`data-
 * minlength="4"`) - a pre-existing asymmetry, reproduced as-is, not "fixed" for
 * consistency.
 *
 * Contrib plugins (`authPlugins`) render via `<tg-auth-plugin-slot>`, same as
 * `LoginFormComponent`/`RegisterFormComponent` - present only on the login sub-form here,
 * matching `invitation-register-form.jade` (which never had one).
 *
 * `invitation.invited_by` can be `null` (a membership invited without an actual inviting
 * user attached, confirmed live against real seed data) - AngularJS's permissive
 * expression evaluator silently rendered `null.full_name_display` as blank, but Angular's
 * strict template checking throws on it, aborting that change-detection pass entirely
 * (which is why the sibling `project_name` interpolation was ALSO found blank during live
 * verification, despite the underlying `invitation` object holding the real value) - same
 * class of AngularJS/Angular permissiveness gap already documented for `tg-nav`'s rollout.
 * Fixed with `?.` on both `invited_by` references.
 *
 * The original also bound `$el.on "click", ".button-login"/".button-register"` alongside
 * the form `submit` handlers - but neither jade template actually has an element with
 * those classes (confirmed by grep), so those bindings were already dead in production;
 * not reproduced (the `(ngSubmit)` binding below covers the real, working path).
 *
 * Double-submit guards: literal 2-second lockouts, same as the rest of this sub-project.
 */
@Component({
    selector: "tg-invitation",
    templateUrl: "./invitation.component.html",
})
export class InvitationComponent implements OnInit {
    loginForm = new FormGroup({
        username: new FormControl("", Validators.required),
        password: new FormControl("", Validators.required),
    });

    registerForm = new FormGroup({
        username: new FormControl("", [Validators.required, Validators.maxLength(255), Validators.pattern(/^[\w.-]+$/)]),
        full_name: new FormControl("", [Validators.required, Validators.maxLength(256)]),
        email: new FormControl("", [Validators.required, Validators.maxLength(255), Validators.email]),
        password: new FormControl("", Validators.required),
    });

    invitation: any;
    invitedByAvatar: any;
    authPlugins: any[] = [];
    registerAcceptedTerms: boolean | undefined;

    private loginSubmitLocked = false;
    private registerSubmitLocked = false;
    private token: string;

    constructor(
        @Inject(AJS_AUTH) private auth: any,
        @Inject(AJS_CONFIRM) private confirm: any,
        @Inject(AJS_TG_LOCATION) private location: any,
        @Inject(AJS_CONFIG) private config: any,
        @Inject(AJS_ROUTE_PARAMS) private routeParams: any,
        @Inject(AJS_NAV_URLS) private navUrls: any,
        @Inject(AJS_ANALYTICS) private analytics: any,
        @Inject(AJS_TRANSLATE) private translate: any,
        @Inject(AJS_ROOT_SCOPE) private rootScope: any,
        @Inject(AJS_AVATAR_SERVICE) private avatarService: any,
        public errors: FormErrorMessageService,
    ) {
        this.token = this.routeParams.token;
    }

    ngOnInit(): void {
        this.authPlugins = this.rootScope.authPlugins || [];

        this.auth.getInvitation(this.token).then(
            (invitation: any) => {
                this.invitation = invitation;
                this.invitedByAvatar = this.avatarService.getAvatar(invitation.invited_by, "avatar");
            },
            () => {
                this.location.path(this.navUrls.resolve("login"));
                this.confirm.notify("light-error", this.translate.instant("INVITATION_LOGIN_FORM.NOT_FOUND"));
            },
        );
    }

    onRegisterAcceptedTermsChange(value: boolean): void {
        this.registerAcceptedTerms = value;
    }

    private goToProject(): void {
        this.location.path(this.navUrls.resolve("project", { project: this.invitation.project_slug }));

        const text = this.translate.instant("INVITATION_LOGIN_FORM.SUCCESS", {
            project_name: this.invitation.project_name,
        });

        this.confirm.notify("success", text);
    }

    submitLogin(): void {
        if (this.loginSubmitLocked) {
            return;
        }

        if (this.loginForm.invalid) {
            this.loginForm.markAllAsTouched();
            return;
        }

        this.loginSubmitLocked = true;
        setTimeout(() => (this.loginSubmitLocked = false), 2000);

        const loginFormType = this.config.get("loginFormType", "normal");
        const data = this.loginForm.value;

        this.auth
            .login(
                {
                    username: data.username,
                    password: data.password,
                    invitation_token: this.token,
                },
                loginFormType,
            )
            .then(
                () => {
                    this.analytics.trackEvent("auth", "invitationAccept", "invitation accept with existing user", 1);
                    this.goToProject();
                },
                (response: any) => {
                    this.confirm.notify("light-error", response.data._error_message);
                },
            );
    }

    submitRegister(): void {
        if (this.registerSubmitLocked) {
            return;
        }

        if (this.registerForm.invalid) {
            this.registerForm.markAllAsTouched();
            return;
        }

        this.registerSubmitLocked = true;
        setTimeout(() => (this.registerSubmitLocked = false), 2000);

        const data = { ...this.registerForm.value, accepted_terms: this.registerAcceptedTerms, token: this.token };

        this.auth.acceptInvitiationWithNewUser(data).then(
            () => {
                this.analytics.trackEvent("auth", "invitationAccept", "invitation accept with new user", 1);
                this.goToProject();
            },
            (response: any) => {
                if (response.data._error_message) {
                    const text = this.translate.instant("COMMON.GENERIC_ERROR", { error: response.data._error_message });
                    this.confirm.notify("light-error", text);
                }

                Object.keys(response.data || {}).forEach((field) => {
                    const control = this.registerForm.get(field);

                    if (control) {
                        const message = Array.isArray(response.data[field]) ? response.data[field][0] : response.data[field];

                        control.setErrors({ server: message });
                        control.markAsTouched();
                    }
                });
            },
        );
    }
}
