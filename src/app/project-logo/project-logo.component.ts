import { Component, ElementRef, EventEmitter, Inject, Input, Output } from "@angular/core";
import { AJS_CONFIRM, AJS_MODEL, AJS_PROJECT_LOGO_SERVICE, AJS_TG_RESOURCES } from "../shared/ajs-tokens";

declare const window: any;

/**
 * Angular replacement for the AngularJS `tgProjectLogo` directive
 * (app/coffee/modules/admin/project-profile.coffee), downgraded in place under the same
 * name - the project logo uploader on the admin profile page. Absorbs two sibling ambient
 * directives that only worked because they shared this one's scope, both confirmed to have
 * no other caller once this migrates:
 *
 * - `tgProjectLogoBigSrc` (app/modules/components/project-logo-big-src/): computed here as
 *   `logoSrc`/`logoBg` getters instead of a `$watch` writing directly to the `<img>`.
 * - `tgProjectLogoModel` (a generic `$parse`-based file-input-to-scope-model binder, used
 *   nowhere else): replaced by a plain `(change)` handler.
 *
 * The original's `showSizeInfo()` targeted a `.size-info` element that doesn't exist
 * anywhere in this template (or the original's) - a pre-existing dead no-op, not
 * reproduced; the oversized-file error is still surfaced via `confirm.notify(...)`.
 */
@Component({
    selector: "tg-project-logo",
    templateUrl: "./project-logo.component.html",
})
export class ProjectLogoComponent {
    @Input() project: any;
    @Output() projectChange = new EventEmitter<any>();

    loading = false;
    spinnerSrc = `${window._version}/svg/spinner-circle.svg`;

    constructor(
        private elementRef: ElementRef,
        @Inject(AJS_TG_RESOURCES) private rs: any,
        @Inject(AJS_MODEL) private model: any,
        @Inject(AJS_CONFIRM) private confirm: any,
        @Inject(AJS_PROJECT_LOGO_SERVICE) private projectLogoService: any,
    ) {}

    get logoSrc(): string {
        const projectLogo = this.project?.logo_big_url;

        if (projectLogo) {
            return projectLogo;
        }

        return this.defaultLogo?.src || "";
    }

    get logoBg(): string {
        if (this.project?.logo_big_url) {
            return "";
        }

        return this.defaultLogo?.color || "";
    }

    private get defaultLogo(): { src: string; color: string } | null {
        if (!this.project) {
            return null;
        }

        return this.projectLogoService.getDefaultProjectLogo(this.project.slug, this.project.id);
    }

    changeLogoClick(): void {
        this.elementRef.nativeElement.querySelector("#logo-field")?.click();
    }

    onFileChange(event: Event): void {
        const file = (event.target as HTMLInputElement).files?.[0];

        if (!file) {
            return;
        }

        this.loading = true;

        this.rs.projects.changeLogo(this.project.id, file).then(
            (response: any) => this.onSuccess(response),
            (response: any) => this.onError(response),
        );
    }

    useDefaultLogo(event: Event): void {
        event.preventDefault();

        this.loading = true;

        this.rs.projects.removeLogo(this.project.id).then(
            (response: any) => this.onSuccess(response),
            (response: any) => this.onError(response),
        );
    }

    private onSuccess(response: any): void {
        this.loading = false;
        this.projectChange.emit(this.model.make_model("projects", response.data));
        this.confirm.notify("success");
    }

    private onError(response: any): void {
        this.loading = false;
        this.confirm.notify("error", response.data._error_message);
    }
}
