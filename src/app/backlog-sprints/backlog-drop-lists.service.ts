import { Injectable } from "@angular/core";

export const BACKLOG_DROP_LIST_ID = "backlog-us-drop-list";

export function sprintDropListId(sprintId: number): string {
    return `backlog-sprint-drop-list-${sprintId}`;
}

/**
 * Connects the backlog table's `cdkDropList` and every sprint's `cdkDropList` in the
 * sidebar, so user stories can be dragged backlog <-> sprint <-> sprint again (the
 * original `tgBacklogSortable` ran one dragula instance over all of them).
 *
 * `BacklogTableComponent` and `BacklogSprintsComponent` are two separate downgraded
 * components (siblings in `backlog.jade`, no common Angular ancestor), so
 * `cdkDropListGroup` can't span them. `cdkDropListConnectedTo` with string ids can: CDK
 * resolves the ids against its global list of drop lists at the start of every drag (and
 * drops itself and unknown ids). Every list therefore binds the same `connectedIds` array,
 * kept up to date in place by `BacklogSprintsComponent` whenever the sprints change.
 */
@Injectable({ providedIn: "root" })
export class BacklogDropListsService {
    readonly connectedIds: string[] = [BACKLOG_DROP_LIST_ID];

    setSprints(sprintIds: number[]): void {
        this.connectedIds.length = 0;
        this.connectedIds.push(BACKLOG_DROP_LIST_ID, ...sprintIds.map(sprintDropListId));
    }
}
