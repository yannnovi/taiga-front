import { AfterViewInit, Directive, ElementRef } from "@angular/core";

/**
 * Angular replacement for the AngularJS `tgAutoSelect` directive
 * (app/modules/components/auto-select/auto-select.directive.coffee) - selects the host
 * input's text content once it's rendered, same one-line behavior as the original
 * (`$timeout(() -> elm[0].select())`).
 */
@Directive({
    selector: "[tgAutoSelect]",
})
export class AutoSelectDirective implements AfterViewInit {
    constructor(private elementRef: ElementRef) {}

    ngAfterViewInit(): void {
        setTimeout(() => (this.elementRef.nativeElement as HTMLInputElement).select(), 0);
    }
}
