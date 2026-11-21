import { Component, ElementRef, Inject, Input } from "@angular/core";
import { AJS_CONFIRM, AJS_QUEUE_MODEL_TRANSFORMATION, AJS_ROOT_SCOPE } from "../shared/ajs-tokens";

declare const $: any;

interface RoleEstimation {
    id: number;
    name: string;
    points: string;
}

/**
 * Angular replacement for `tgUsEstimation` (`app/coffee/modules/common/estimation.coffee`),
 * the per-role points widget of the user story detail sidebar. Same name, now an element
 * (`tg-us-estimation.ticket-section.ticket-estimation`). The original read
 * `$scope.project` ambiently and delegated to `$tgEstimationsService`, which re-rendered a
 * lodash template by hand and injected the points popover as an HTML string; its only
 * remaining caller was this directive, so both are gone (the backlog row and the
 * estimation lightbox already have their own Angular versions).
 *
 * Saving is unchanged: `$tgQueueModelTransformation.save` with the new `points` map, then
 * `object:updated`; the role being saved shows a spinner meanwhile.
 */
@Component({
    selector: "tg-us-estimation",
    templateUrl: "./us-estimation.component.html",
})
export class UsEstimationComponent {
    @Input() us: any;
    @Input() project: any;

    openRoleId: number | null = null;
    loadingRoleId: number | null = null;
    popBottom = false;

    readonly spinnerSrc = `${(window as any)._version}/svg/spinner-circle.svg`;

    constructor(
        private elementRef: ElementRef<HTMLElement>,
        @Inject(AJS_QUEUE_MODEL_TRANSFORMATION) private modelTransform: any,
        @Inject(AJS_ROOT_SCOPE) private rootScope: any,
        @Inject(AJS_CONFIRM) private confirm: any,
    ) {}

    get editable(): boolean {
        return !!this.project && !this.project.archived_code && this.project.my_permissions.indexOf("modify_us") !== -1;
    }

    private pointById(id: any): any {
        return (this.project?.points || []).find((p: any) => p.id === id);
    }

    get roles(): RoleEstimation[] {
        return (this.project?.roles || [])
            .filter((role: any) => role.computable)
            .map((role: any) => {
                const point = this.pointById(this.us?.points?.[role.id]);

                return { id: role.id, name: role.name, points: point && point.name != null ? point.name : "?" };
            });
    }

    get totalPoints(): string | number {
        const values = Object.values(this.us?.points || {}).map((pointId) => this.pointById(pointId)?.value);

        if (!values.length) {
            return "?";
        }

        const notNull = values.filter((v) => v != null) as number[];

        return notNull.length ? notNull.reduce((acc, n) => acc + n, 0) : "?";
    }

    get points(): any[] {
        return this.project?.points || [];
    }

    /** Mirrors the original: a horizontal popover when any point name is longer than 5. */
    get horizontal(): boolean {
        return this.points.some((p) => `${p.name}`.length > 5);
    }

    isSelected(roleId: number, pointId: any): boolean {
        return this.us?.points?.[roleId] === pointId;
    }

    trackById(_index: number, item: any): any {
        return item.id;
    }

    openRole(roleId: number, event: MouseEvent): void {
        event.preventDefault();
        event.stopPropagation();

        if (!this.editable) {
            return;
        }

        this.openRoleId = roleId;
        this.popBottom = false;

        setTimeout(() => {
            const pop = $(this.elementRef.nativeElement).find(".pop-points-open");

            pop.popover().open(() => {
                this.openRoleId = null;
            });

            if (pop.length && pop.offset().top + pop.height() > document.body.clientHeight) {
                this.popBottom = true;
            }
        });
    }

    selectPoint(roleId: number, pointId: any, event: MouseEvent): void {
        event.preventDefault();
        event.stopPropagation();

        $(this.elementRef.nativeElement).find(".popover").popover().close();
        this.openRoleId = null;

        const points = { ...(this.us.points || {}), [roleId]: pointId };
        this.loadingRoleId = roleId;

        this.modelTransform
            .save((us: any) => {
                us.points = points;
                return us;
            })
            .then(
                () => {
                    this.loadingRoleId = null;
                    this.rootScope.$broadcast("object:updated");
                },
                () => {
                    this.loadingRoleId = null;
                    this.confirm.notify("error");
                },
            );
    }
}
