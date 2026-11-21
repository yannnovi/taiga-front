import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { MembershipsTableComponent } from "./memberships-table.component";

/**
 * Admin > Members: replaces `tgMemberships` (paginator), `tgMembershipsRowAvatar`,
 * `tgMembershipsRowAdminCheckbox`, `tgMembershipsRowRoleSelector`,
 * `tgMembershipsRowActions` and `includes/modules/admin/admin-membership-table.jade`.
 */
angular
    .module("taigaAdmin")
    .directive("tgMembershipsTable", downgradeComponent({ component: MembershipsTableComponent }));
