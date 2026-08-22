import {
    Component,
    ElementRef,
    EventEmitter,
    Inject,
    Input,
    OnChanges,
    OnDestroy,
    Output,
} from "@angular/core";
import { AJS_DATE_PICKER_CONFIG_SERVICE, AJS_DUE_DATE_SERVICE } from "../shared/ajs-tokens";

declare const moment: any;
declare const Pikaday: any;

/**
 * Angular replacement for the AngularJS `tgDueDatePopover` directive
 * (app/modules/components/due-date/due-date-popover.directive.coffee), downgraded in place
 * under the same name - the due-date icon/button + inline Pikaday popover used inside
 * `tg-lb-create-edit`'s issue/task/US fields.
 *
 * `notAutoSave` (an isolate-scope binding on the original) is dropped, not ported: none of
 * `tgDueDateService`'s methods (`visible`/`disabled`/`color`/`title`) ever read it, and the
 * original's own click handler never calls `DueDateCtrl.setDueDate()` (the only place that
 * binding would matter, since it's what's passed to the nested `tg-lb-set-due-date`
 * lightbox) - this popover only ever toggles its own bound Pikaday instance directly, it
 * never opens that lightbox. `tg-lb-set-due-date` itself is therefore out of scope for this
 * port too - nothing here reaches it.
 */
@Component({
    selector: "tg-due-date-popover",
    templateUrl: "./due-date-popover.component.html",
})
export class DueDatePopoverComponent implements OnChanges, OnDestroy {
    @Input() dueDate: any;
    @Output() dueDateChange = new EventEmitter<any>();
    @Input() isClosed: any;
    @Input() item: any;
    @Input() objType: string;
    @Input() format: string;

    open = false;

    private picker: any;

    constructor(
        private elementRef: ElementRef,
        @Inject(AJS_DUE_DATE_SERVICE) private dueDateService: any,
        @Inject(AJS_DATE_PICKER_CONFIG_SERVICE) private datePickerConfigService: any,
    ) {}

    ngOnChanges(): void {
        if (!this.picker) {
            this.initPicker();
        }
    }

    ngOnDestroy(): void {
        this.picker?.destroy();
    }

    private get scope(): any {
        return { dueDate: this.dueDate, isClosed: this.isClosed, objType: this.objType, format: this.format };
    }

    visible(): boolean {
        return this.dueDateService.visible(this.scope);
    }

    disabled(): boolean {
        return this.dueDateService.disabled(this.scope);
    }

    color(): string | null {
        return this.dueDateService.color(this.scope);
    }

    title(): string {
        return this.dueDateService.title(this.scope);
    }

    toggle(event: MouseEvent): void {
        event.preventDefault();
        event.stopPropagation();

        if (this.open) {
            this.picker.hide();
            return;
        }

        if (!this.picker.getDate() && this.dueDate) {
            this.picker.setDate(moment(this.dueDate).format("YYYY-MM-DD"));
        }

        this.picker.show();
        this.open = true;
    }

    clean(event: MouseEvent): void {
        event.preventDefault();
        event.stopPropagation();

        this.dueDate = null;
        this.dueDateChange.emit(null);
        this.picker.setDate(null);
        this.open = false;
        this.picker.hide();
    }

    private initPicker(): void {
        const el = this.elementRef.nativeElement;
        const config = this.datePickerConfigService.get();

        Object.assign(config, {
            field: el.querySelector(".due-date-button"),
            container: el.querySelector(".date-picker-container"),
            bound: true,
            onClose: () => {
                this.open = false;
            },
            onSelect: () => {
                this.dueDate = this.picker.getMoment().format("YYYY-MM-DD");
                this.dueDateChange.emit(this.dueDate);
            },
        });

        this.picker = new Pikaday(config);
    }
}
