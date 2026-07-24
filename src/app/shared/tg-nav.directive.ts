import { Directive, ElementRef, HostListener, Inject, Input, OnChanges } from "@angular/core";
import { AJS_AUTH, AJS_LIGHTBOX_SERVICE, AJS_NAV_URLS, AJS_SECTIONS, AJS_TG_LOCATION } from "./ajs-tokens";

declare const $: any;

/**
 * Angular-native equivalent of the AngularJS `tgNav` attribute directive
 * (app/coffee/modules/base/navurls.coffee). `tgNav` itself is untouched and keeps working
 * exactly as before for every existing AngularJS template - this is a *separate*,
 * additive directive for use from new Angular component templates, so a leaf component
 * that needs a navigation link no longer has to stay AngularJS just because of that one
 * dependency.
 *
 * Calling convention is intentionally different from the original's string mini-DSL
 * (`tg-nav="project-backlog:project=vm.x,section=vm.y"`, parsed and `$scope.$eval`'d by
 * hand) - Angular has no equivalent to arbitrary expression evaluation from a plain
 * attribute string, and re-implementing one would just be reinventing `$parse` badly.
 * Instead the route name and its params are two ordinary Angular inputs:
 *
 *   <a [tgNav]="'project'" [tgNavParams]="{project: proj.slug, section: 'timeline'}">
 *
 * Same underlying behavior as the original:
 * - resolves the URL via the existing `$tgNavUrls` service (untouched) - so route
 *   definitions stay in one place, shared with every AngularJS-side `tg-nav` usage.
 * - `name === 'project'` gets the same `$tgSections.getPath(...)` suffix logic.
 * - the current user's username is auto-added to the params (`options.user`), same as
 *   the original, whether or not the target route actually uses it.
 * - sets a real `href` on anchor tags (so hover/right-click/"open in new tab" all work
 *   natively) rather than intercepting every click blindly.
 * - primary click navigates via `$tgLocation` (AngularJS still owns all routing) and
 *   closes any open lightboxes, same as the original; middle click opens a new tab;
 *   meta/ctrl-click is left to the browser (new tab / new window) - not intercepted.
 * - the `.noclick` class opt-out is preserved for parity with existing markup patterns.
 *
 * Deliberate simplification: the original computed the URL lazily on `pointerenter` (a
 * perf trick to avoid resolving hundreds of links in one big list upfront). This version
 * computes eagerly in `ngOnChanges`, which is simpler and idiomatic for Angular's
 * reactivity model - fine for the moderate-sized lists any newly-migrated component is
 * likely to render; revisit only if a real perf issue shows up in a large list.
 */
@Directive({
    selector: "[tgNav]",
})
export class TgNavDirective implements OnChanges {
    @Input() tgNav: string | undefined;
    @Input() tgNavParams: Record<string, any> = {};
    @Input() tgNavGetParams: Record<string, any> | undefined;

    private fullUrl = "";

    constructor(
        private elementRef: ElementRef<HTMLElement>,
        @Inject(AJS_NAV_URLS) private navUrls: any,
        @Inject(AJS_AUTH) private auth: any,
        @Inject(AJS_TG_LOCATION) private location: any,
        @Inject(AJS_LIGHTBOX_SERVICE) private lightboxService: any,
        @Inject(AJS_SECTIONS) private sections: any,
    ) {}

    ngOnChanges(): void {
        this.computeUrl();
    }

    private computeUrl(): void {
        if (!this.tgNav) {
            return;
        }

        const options: Record<string, any> = { ...this.tgNavParams };
        const user = this.auth.getUser();

        if (user) {
            options["user"] = user.username;
        }

        let name = this.tgNav;

        if (name === "project") {
            const path = this.sections.getPath(options["project"], options["section"]);
            name = `${name}-${path}`;
        }

        const url = this.navUrls.resolve(name);

        this.fullUrl = this.navUrls.formatUrl(url, options);

        if (this.tgNavGetParams) {
            this.fullUrl = `${this.fullUrl}?${$.param(this.tgNavGetParams)}`;
        }

        if (this.elementRef.nativeElement.tagName === "A") {
            this.elementRef.nativeElement.setAttribute("href", this.fullUrl);
        }
    }

    @HostListener("click", ["$event"])
    onClick(event: MouseEvent): void {
        this.navigate(event, false);
    }

    @HostListener("auxclick", ["$event"])
    onAuxClick(event: MouseEvent): void {
        this.navigate(event, true);
    }

    private navigate(event: MouseEvent, isAux: boolean): void {
        if (event.metaKey || event.ctrlKey) {
            return;
        }

        if (this.elementRef.nativeElement.classList.contains("noclick")) {
            return;
        }

        if (!isAux && event.button === 0) {
            event.preventDefault();
            this.location.url(this.fullUrl);
        } else if (isAux && event.button === 1) {
            event.preventDefault();
            window.open(this.fullUrl);
        } else {
            return;
        }

        this.lightboxService.closeAll();
    }
}
