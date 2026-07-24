import { Component, Input } from "@angular/core";

/**
 * Angular replacement for the AngularJS `tgNoMoreMembershipsExplanation` directive
 * (app/coffee/modules/admin/memberships.coffee), downgraded in place under the same name -
 * a template-only directive (no controller at all), same family as
 * blocked-project-explanation/cant-own-project-explanation earlier in this migration.
 * `ownerEmail` is declared for fidelity with the original's scope bindings, but is
 * genuinely unused - the template reads `project.owner.username` directly instead.
 */
@Component({
    selector: "tg-no-more-memberships-explanation",
    templateUrl: "./no-more-memberships-explanation.component.html",
})
export class NoMoreMembershipsExplanationComponent {
    @Input() project: any;
    @Input() ownerEmail: any;
}
