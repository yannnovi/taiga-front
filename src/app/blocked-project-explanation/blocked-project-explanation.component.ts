import { Component, Input } from "@angular/core";

/**
 * Angular replacement for the AngularJS `tgBlockedProjectExplanation` directive
 * (app/modules/projects/components/blocked-project-explanation.directive.coffee),
 * downgraded in place under the same name. The original directive declared no isolate
 * scope at all, reading `vm.project` straight off the parent controller's scope - the
 * downgraded version makes that dependency explicit via `@Input() project`, and the one
 * caller (blocked-project.jade) now passes it via `bind-project`.
 */
@Component({
    selector: "tg-blocked-project-explanation",
    templateUrl: "./blocked-project-explanation.component.html",
})
export class BlockedProjectExplanationComponent {
    @Input() project: any;
}
