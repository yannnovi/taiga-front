import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { TeamFiltersComponent, TeamTableComponent } from "./team.components";

/**
 * Team page: replace `tgTeamFilters`, `tgTeamCurrentUser`, `tgTeamMembers`,
 * `tgTeamMemberStats`, `tgLeaveProject`, the `membersFilter` filter and the two
 * `includes/modules/team/*.jade` blocks.
 */
angular
    .module("taigaTeam")
    .directive("tgTeamFilters", downgradeComponent({ component: TeamFiltersComponent }))
    .directive("tgTeamTable", downgradeComponent({ component: TeamTableComponent }));
