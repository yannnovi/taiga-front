import { AfterViewInit, Component, ElementRef, Inject, Input, OnChanges, OnDestroy, ViewChild } from "@angular/core";
import { AJS_ROOT_SCOPE } from "../shared/ajs-tokens";

/**
 * Angular replacement for the AngularJS `tgAnimatedCounter` directive
 * (app/modules/components/animated-counter/), downgraded in place under the same name -
 * used only by the kanban board's per-column US counters (kanban-table.jade), migrated
 * alongside `tgKanbanSortable`/`KanbanTableComponent`/`KanbanColumnComponent`. A small,
 * self-contained "counter roll" animation: when `data.count` changes, the old value slides
 * out and the new one slides in via a CSS transition on `.counter-translator`, driven here
 * by toggling the `inc`/`dec` classes and settling on `transitionend` - same mechanism as
 * the original, just re-hosted on Angular lifecycle hooks instead of `$scope.$watch`.
 */
@Component({
    selector: "tg-animated-counter",
    templateUrl: "./animated-counter.component.html",
})
export class AnimatedCounterComponent implements AfterViewInit, OnChanges, OnDestroy {
    @Input() data: { count: number; wip?: number };
    @Input() disabled: boolean;

    @ViewChild("counter") counterRef: ElementRef<HTMLElement>;

    nextUp: { current: number; wip?: number } | undefined;
    nextDown: { current: number; wip?: number } | undefined;
    renderCount: { current: number; wip?: number } = { current: 0 };

    private initialLoad = false;
    private lastCount: number | undefined;
    private unwatch: () => void;
    private readonly onTransitionEnd = () => this.settle();

    constructor(@Inject(AJS_ROOT_SCOPE) private rootScope: any) {}

    ngAfterViewInit(): void {
        this.counterRef.nativeElement.addEventListener("transitionend", this.onTransitionEnd);

        this.unwatch = this.rootScope.$on("kanban:userstories:loaded", () => {
            this.initialLoad = true;
            this.unwatch();
        });
    }

    ngOnDestroy(): void {
        this.counterRef?.nativeElement.removeEventListener("transitionend", this.onTransitionEnd);
        this.unwatch?.();
    }

    ngOnChanges(): void {
        if (this.disabled) {
            return;
        }

        this.renderData();
    }

    private settle(): void {
        this.renderCount = this.nextUp !== undefined ? this.nextUp : this.nextDown;
        this.counterRef.nativeElement.classList.remove("inc", "dec");
    }

    private renderData(): void {
        const getCounter = (num: number) => ({ current: num, wip: this.data?.wip });

        this.nextUp = undefined;
        this.nextDown = undefined;

        if (!this.data || this.data.count === undefined) {
            this.lastCount = 0;
            this.renderCount = getCounter(this.lastCount);
            return;
        } else if (this.lastCount === this.data.count) {
            return;
        } else if (!this.initialLoad || this.lastCount === undefined) {
            this.lastCount = this.data.count;
            this.renderCount = getCounter(this.lastCount);
            return;
        }

        if (this.data.count > this.lastCount) {
            this.lastCount = this.data.count;
            this.nextUp = getCounter(this.data.count);
        } else if (this.data.count < this.lastCount) {
            this.lastCount = this.data.count;
            this.nextDown = getCounter(this.data.count);
        }

        if (this.nextUp !== undefined || this.nextDown !== undefined) {
            this.counterRef.nativeElement.classList.remove("inc", "dec");

            setTimeout(() => {
                if (this.nextUp !== undefined) {
                    this.counterRef.nativeElement.classList.add("inc");
                } else if (this.nextDown !== undefined) {
                    this.counterRef.nativeElement.classList.add("dec");
                }
            });
        }
    }
}
