import { Component, EventEmitter, Inject, OnInit, Output } from "@angular/core";
import { AJS_STORAGE } from "../shared/ajs-tokens";

const ZOOMS = [
    ["assigned_to", "ref"],
    ["subject", "card-data", "assigned_to_extended"],
    ["tags", "extra_info", "unfold"],
    ["related_tasks", "attachments"],
];

/**
 * Angular replacement for the AngularJS `tgKanbanBoardZoom` directive
 * (app/modules/components/kanban-board-zoom/), downgraded in place under the same name.
 * Same shape and same @Output() naming gotcha as taskboard-zoom (see that component for
 * the explanation) - `zoomChange`, not `onZoomChange`.
 *
 * `projectService` was injected by the original directive but never actually used in its
 * body - dropped here, same as `$tgEvents` was for the `notifications` module.
 */
@Component({
    selector: "tg-kanban-board-zoom",
    templateUrl: "./kanban-board-zoom.component.html",
})
export class KanbanBoardZoomComponent implements OnInit {
    @Output() zoomChange = new EventEmitter<{ zoomLevel: number; zoom: string[] }>();

    zoomIndex = 1;
    levels = 4;

    constructor(@Inject(AJS_STORAGE) private storage: any) {}

    ngOnInit(): void {
        this.zoomIndex = this.storage.get("kanban_zoom", 1);
        this.emitZoom(this.zoomIndex);
    }

    onZoomIndexChange(zoomLevel: number): void {
        this.zoomIndex = zoomLevel;
        this.emitZoom(zoomLevel);
    }

    private emitZoom(zoomIndexRaw: number): void {
        let zoomIndex = zoomIndexRaw;

        if (zoomIndex > 3) {
            zoomIndex = 3;
        }

        zoomIndex = Number(zoomIndex);

        if (Number(this.storage.get("kanban_zoom")) !== zoomIndex) {
            this.storage.set("kanban_zoom", zoomIndex);
        }

        const zoom = ZOOMS.reduce((result: string[], value, key) => {
            if (key <= zoomIndex) {
                return result.concat(value);
            }

            return result;
        }, []);

        this.zoomChange.emit({ zoomLevel: zoomIndex, zoom });
    }
}
