import { Component, Inject, Input, OnChanges, OnInit, SimpleChanges } from "@angular/core";
import { AJS_LIGHTBOX_FACTORY, AJS_PROJECT_SERVICE } from "../shared/ajs-tokens";

declare const _: any;

/**
 * Angular replacement for the AngularJS `tgMoveToSprint` directive
 * (app/modules/components/move-to-sprint/), downgraded in place under the same name -
 * the "move unfinished items to next sprint" button on the sprint summary bar.
 *
 * Callers (still AngularJS) keep using `bind-x` one-way expressions for all inputs -
 * simpler than trying to replicate the original's `=` two-way bindings, and this
 * component never needs to write back into `sprint`/`uss`/etc. anyway.
 */
@Component({
    selector: "tg-move-to-sprint",
    templateUrl: "./move-to-sprint.component.html",
})
export class MoveToSprintComponent implements OnInit, OnChanges {
    @Input() sprint: any;
    @Input() uss: any;
    @Input() unnasignedTasks: any;
    @Input() issues: any;
    @Input() disabled: any;
    @Input() taskMap: any;

    hasOpenItems = false;

    private permissions: any;
    private openItems: { uss: any[]; tasks: any[]; issues: any[] } = { uss: [], tasks: [], issues: [] };

    constructor(
        @Inject(AJS_LIGHTBOX_FACTORY) private lightboxFactory: any,
        @Inject(AJS_PROJECT_SERVICE) private projectService: any,
    ) {}

    ngOnInit(): void {
        this.permissions = this.projectService.project?.get("my_permissions");
    }

    ngOnChanges(changes: SimpleChanges): void {
        // `ngOnChanges` can fire before `ngOnInit` sets `this.permissions` (Angular's
        // documented lifecycle order for a component's very first change), and
        // `projectService.project` itself isn't always populated yet the first time this
        // fires either - re-resolve here defensively rather than assume `ngOnInit` already
        // ran with a loaded project.
        if (!this.permissions) {
            this.permissions = this.projectService.project?.get("my_permissions") || [];
        }

        if (changes["uss"]) {
            this.getOpenUss();
        }

        if (changes["unnasignedTasks"]) {
            this.getOpenStorylessTasks();
        }

        if (changes["issues"]) {
            this.getOpenIssues();
        }
    }

    openLightbox(): void {
        if (this.disabled !== true && this.hasOpenItems) {
            const openItems: any = {};

            _.map(this.openItems, (itemsList: any[], itemsType: string) => {
                if (itemsList.length) {
                    openItems[itemsType] = itemsList;
                }
            });

            // tg-lb-move-to-sprint is now a downgraded Angular component (see
            // src/app/lightbox-move-to-sprint/) - its inputs need the `bind-x` attribute
            // convention rather than the plain literal-attribute form the original
            // (still-AngularJS) lightbox used.
            this.lightboxFactory.create(
                "tg-lb-move-to-sprint",
                { class: "lightbox lightbox-move-to-sprint", "bind-sprint": "sprint", "bind-open-items": "openItems" },
                { sprint: this.sprint, openItems },
            );
        }
    }

    private checkOpenItems(): boolean {
        return Object.keys(this.openItems).some((x) => (this.openItems as any)[x].length > 0);
    }

    private getOpenUss(): void {
        if (!this.uss || this.permissions.indexOf("modify_us") === -1) {
            return;
        }

        this.openItems.uss = [];

        this.uss.map((us: any) => {
            if (us.is_closed === false) {
                this.openItems.uss.push({ us_id: us.id, order: us.sprint_order });
            }
        });

        this.hasOpenItems = this.checkOpenItems();
    }

    private getOpenStorylessTasks(): void {
        if (!this.unnasignedTasks || this.permissions.indexOf("modify_task") === -1) {
            return;
        }

        this.openItems.tasks = [];

        this.unnasignedTasks.map((column: any[]) =>
            column.map((taskId: any) => {
                const task = this.taskMap.get(taskId);

                if (task.get("model").get("is_closed") === false) {
                    this.openItems.tasks.push({
                        task_id: task.get("model").get("id"),
                        order: task.get("model").get("taskboard_order"),
                    });
                }
            }),
        );

        this.hasOpenItems = this.checkOpenItems();
    }

    private getOpenIssues(): void {
        if (!this.issues || this.permissions.indexOf("modify_issue") === -1) {
            return;
        }

        this.openItems.issues = [];

        this.issues.map((issue: any) => {
            if (issue.get("status").get("is_closed") === false) {
                this.openItems.issues.push({ issue_id: issue.get("id") });
            }
        });

        this.hasOpenItems = this.checkOpenItems();
    }
}
