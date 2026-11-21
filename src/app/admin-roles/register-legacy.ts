import angular from "angular";
import { downgradeComponent } from "@angular/upgrade/static";
import { EditRoleComponent, NewRoleComponent, RolePermissionsComponent } from "./admin-roles.components";

/** Admin > Permissions: replace `tgEditRole`, `tgNewRole`, `tgRolePermissions` (same names) - `tgRoles` was empty. */
angular
    .module("taigaAdmin")
    .directive("tgEditRole", downgradeComponent({ component: EditRoleComponent }))
    .directive("tgNewRole", downgradeComponent({ component: NewRoleComponent }))
    .directive("tgRolePermissions", downgradeComponent({ component: RolePermissionsComponent }));
