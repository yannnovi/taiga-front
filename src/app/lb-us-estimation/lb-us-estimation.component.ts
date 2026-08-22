import { Component, ElementRef, Input, OnChanges } from "@angular/core";

declare const $: any;

/**
 * Angular replacement for the AngularJS `tgLbUsEstimation` directive
 * (app/coffee/modules/common/estimation.coffee), downgraded in place under the same name -
 * the per-role points estimation widget used inside `tg-lb-create-edit`'s US fields.
 *
 * The "for lightbox" variant of `$tgEstimationsService`'s popover pattern (the same one
 * `BacklogRowComponent` already reimplemented natively for the backlog table): unlike the
 * page-level `tgUsEstimation` (auto-saves via `$tgQueueModelTransformation`), this one only
 * ever mutates `@Input() item.points` in place - the lightbox's own form submit is what
 * actually persists it, same non-saving convention as the assigned-to/issue-* widgets in
 * this same lightbox.
 */
@Component({
    selector: "tg-lb-us-estimation",
    templateUrl: "./lb-us-estimation.component.html",
})
export class LbUsEstimationComponent implements OnChanges {
    @Input() item: any;
    @Input() project: any;

    isEditable = false;
    popoverMode: "roles" | "points" = "roles";
    popoverRoleId: any = null;

    constructor(private elementRef: ElementRef) {}

    ngOnChanges(): void {
        this.isEditable = !this.project?.archived_code && this.project?.my_permissions?.indexOf("modify_us") > -1;
    }

    private get pointsById(): Record<string, any> {
        const byId: Record<string, any> = {};

        (this.project?.points || []).forEach((p: any) => {
            byId[p.id] = p;
        });

        return byId;
    }

    get totalPoints(): number | string {
        const values = Object.keys(this.item?.points || {}).map((k) => this.pointsById[this.item.points[k]]?.value);

        if (values.length === 0) {
            return "?";
        }

        const notNull = values.filter((v) => v !== null && v !== undefined);

        if (notNull.length === 0) {
            return "?";
        }

        return notNull.reduce((acc, n) => acc + n, 0);
    }

    get roles(): any[] {
        return (this.project?.roles || [])
            .filter((r: any) => r.computable)
            .map((role: any) => {
                const pointId = this.item?.points ? this.item.points[role.id] : undefined;
                const pointObj = this.pointsById[pointId];

                return { ...role, points: pointObj?.name ?? "?" };
            });
    }

    get pointsForRole(): any[] {
        return (this.project?.points || []).map((point: any) => ({
            ...point,
            selected: this.item?.points && this.item.points[this.popoverRoleId] === point.id,
        }));
    }

    trackByRoleId(index: number, role: any): any {
        return role.id;
    }

    trackByPointId(index: number, point: any): any {
        return point.id;
    }

    openRolePopover(event: MouseEvent): void {
        if (!this.isEditable) {
            return;
        }

        const target = event.currentTarget as HTMLElement;

        this.popoverMode = "points";
        this.popoverRoleId = target.getAttribute("data-role-id");

        target.parentElement
            ?.querySelectorAll(".ticket-role-points")
            .forEach((el) => el.classList.remove("active"));
        target.classList.add("active");

        // Matches `BacklogRowComponent.reopenPointsPopover` - `*ngIf` only just swapped in
        // a brand-new `.pop-points-open` element, `requestAnimationFrame` (rather than
        // `setTimeout(0)`) reliably waits for Angular to have actually rendered it first.
        requestAnimationFrame(() => {
            $(target).find(".pop-points-open").popover().open();
        });
    }

    selectPoint(pointId: any, event: MouseEvent): void {
        event.preventDefault();
        event.stopPropagation();

        $(this.elementRef.nativeElement).find(".popover").popover().close();

        const points = { ...this.item.points, [this.popoverRoleId]: pointId };

        this.item.points = points;
    }
}
