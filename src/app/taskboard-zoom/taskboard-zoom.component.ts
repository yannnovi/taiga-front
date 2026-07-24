import { Component, EventEmitter, Inject, OnInit, Output } from "@angular/core";
import { AJS_STORAGE } from "../shared/ajs-tokens";

const ZOOMS = [
    ["assigned_to", "ref"],
    ["subject"],
    ["tags", "extra_info", "unfold", "card-data", "assigned_to_extended"],
    ["related_tasks", "attachments"],
];

/**
 * Angular replacement for the AngularJS `tgTaskboardZoom` directive
 * (app/modules/components/taskboard-zoom/), downgraded in place under the same name.
 * Caller (taskboard.jade) already used `on-zoom-change="ctrl.setZoom(zoomLevel, zoom)"`
 * (AngularJS's own kebab-case normalization of a `&` binding named `onZoomChange` happens
 * to already look like downgradeComponent's convention) - but downgradeComponent derives
 * that attribute name by prefixing "on" onto the *property* name, so an @Output() actually
 * named `onZoomChange` would produce `on-on-zoom-change` and never match. The property is
 * named `zoomChange` here instead so the existing attribute keeps matching. The invoked
 * expression also needs `$event` instead of the named locals AngularJS `&` bindings allow:
 * `ctrl.setZoom($event.zoomLevel, $event.zoom)`.
 */
@Component({
    selector: "tg-taskboard-zoom",
    templateUrl: "./taskboard-zoom.component.html",
})
export class TaskboardZoomComponent implements OnInit {
    @Output() zoomChange = new EventEmitter<{ zoomLevel: number; zoom: string[] }>();

    zoomIndex = 2;
    levels = 4;

    constructor(@Inject(AJS_STORAGE) private storage: any) {}

    ngOnInit(): void {
        this.zoomIndex = this.storage.get("taskboard_zoom", 2);
        this.emitZoom(this.zoomIndex);
    }

    onZoomIndexChange(zoomLevel: number): void {
        this.zoomIndex = zoomLevel;
        this.emitZoom(zoomLevel);
    }

    private emitZoom(zoomIndexRaw: number): void {
        const zoomIndex = Number(zoomIndexRaw);

        if (Number(this.storage.get("taskboard_zoom")) !== zoomIndex) {
            this.storage.set("taskboard_zoom", zoomIndex);
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
