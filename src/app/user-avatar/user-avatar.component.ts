import { Component, ElementRef, EventEmitter, Inject, Input, OnChanges, Output } from "@angular/core";
import { AJS_AUTH, AJS_AVATAR_SERVICE, AJS_CONFIRM, AJS_MODEL, AJS_TG_RESOURCES } from "../shared/ajs-tokens";

declare const window: any;

/**
 * Angular replacement for the AngularJS `tgUserAvatar` directive
 * (app/coffee/modules/user-settings/main.coffee), downgraded in place under the same
 * name - the avatar uploader on the user profile page. Absorbs the sibling ambient
 * `tgAvatarModel` directive (a generic `$parse`-based file-input-to-scope-model binder,
 * used nowhere else) as a plain `(change)` handler - same pattern already used for
 * `ProjectLogoComponent`'s `tgProjectLogo`/`tgProjectLogoModel`.
 *
 * Also absorbs `tg-avatar-big` (`img(tg-avatar-big="user")` in the original template) -
 * a first attempt wrapped it via `UpgradeComponent` (`TgAvatarBigUpgradedDirective`), which
 * built and passed `strictTemplates`, but silently never rendered anything: live-browser
 * debugging (`ng.getDirectives()` on the `<img>`, then reading `@angular/upgrade`'s actual
 * `ngOnInit`/`UpgradeHelper.compileTemplate()` source) found that `UpgradeComponent`
 * requires the wrapped AngularJS directive to be component-like (`template`/`templateUrl`)
 * - `AvatarDirective` (app/modules/components/avatar/avatar.directive.coffee) has neither,
 * only `scope`+`link`, so `ngOnInit` throws `"...is not a component, it is missing
 * template."` on every instance, permanently before `bindingDestination` is ever assigned -
 * the `@Input()` reaches the wrapper fine, it just never reaches the wrapped directive's own
 * scope. `UpgradeComponent` cannot wrap a template-less attribute directive at all, no
 * matter how the selector/`@Input()` are named. Same finding already documented on
 * `ProfileBarComponent` (its own doc comment) for the exact same directive - fixed the same
 * way: call `tgAvatarService.getAvatar(user, 'avatarBig')` directly and bind the returned
 * `{url, fullName, bg}` in the template, replicating the original `link` function instead of
 * wrapping it. `TgAvatarBigUpgradedDirective` removed entirely (dead end, no other caller).
 *
 * The original's `showSizeInfo()` targeted a `.size-info` element that doesn't exist
 * anywhere in `user-profile.jade` (or anywhere else) - a pre-existing dead no-op, same
 * finding as `ProjectLogoComponent`'s - not reproduced; the oversized-file error is still
 * surfaced via `confirm.notify(...)`.
 */
@Component({
    selector: "tg-user-avatar",
    templateUrl: "./user-avatar.component.html",
})
export class UserAvatarComponent implements OnChanges {
    @Input() user: any;
    @Output() userChange = new EventEmitter<any>();

    loading = false;
    spinnerSrc = `${window._version}/svg/spinner-circle.svg`;
    avatar: any;

    constructor(
        private elementRef: ElementRef,
        @Inject(AJS_TG_RESOURCES) private rs: any,
        @Inject(AJS_MODEL) private model: any,
        @Inject(AJS_AUTH) private auth: any,
        @Inject(AJS_CONFIRM) private confirm: any,
        @Inject(AJS_AVATAR_SERVICE) private avatarService: any,
    ) {}

    ngOnChanges(): void {
        this.avatar = this.avatarService.getAvatar(this.user, "avatarBig");
    }

    changeAvatarClick(): void {
        this.elementRef.nativeElement.querySelector("#avatar-field")?.click();
    }

    onFileChange(event: Event): void {
        const file = (event.target as HTMLInputElement).files?.[0];

        if (!file) {
            return;
        }

        this.loading = true;

        this.rs.userSettings.changeAvatar(file).then(
            (response: any) => this.onSuccess(response),
            (response: any) => this.onError(response),
        );
    }

    useGravatar(event: Event): void {
        event.preventDefault();
        this.loading = true;

        this.rs.userSettings.removeAvatar().then(
            (response: any) => this.onSuccess(response),
            (response: any) => this.onError(response),
        );
    }

    private onSuccess(response: any): void {
        this.loading = false;

        const user = this.model.make_model("users", response.data);

        this.auth.setUser(user);
        this.user = user;
        this.avatar = this.avatarService.getAvatar(this.user, "avatarBig");
        this.userChange.emit(user);
        this.confirm.notify("success");
    }

    private onError(response: any): void {
        this.loading = false;
        this.confirm.notify("error", response.data._error_message);
    }
}
