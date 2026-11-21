###
# This source code is licensed under the terms of the
# GNU Affero General Public License found in the LICENSE file in
# the root directory of this source tree.
#
# Copyright (c) 2021-present Kaleidos INC
###

taiga = @.taiga

mixOf = @.taiga.mixOf
bindOnce = @.taiga.bindOnce
debounce = @.taiga.debounce
bindMethods = @.taiga.bindMethods

module = angular.module("taigaAdmin")

publicPermissions = ['view_epics', 'view_milestones', 'view_us', 'view_tasks', 'view_issues', 'view_wiki_pages', 'view_wiki_links']

#############################################################################
## Project Roles Controller
#############################################################################

class RolesController extends mixOf(taiga.Controller, taiga.PageMixin, taiga.FiltersMixin)
    @.$inject = [
        "$scope",
        "$rootScope",
        "$tgRepo",
        "$tgConfirm",
        "$tgResources",
        "$routeParams",
        "$q",
        "$tgLocation",
        "$tgNavUrls",
        "$tgModel",
        "tgAppMetaService",
        "$translate",
        "tgErrorHandlingService",
        "tgProjectService"
    ]

    constructor: (@scope, @rootscope, @repo, @confirm, @rs, @params, @q, @location, @navUrls,
                  @model, @appMetaService, @translate, @errorHandlingService, @projectService) ->
        bindMethods(@)

        @scope.sectionName = "ADMIN.MENU.PERMISSIONS"
        @scope.project = {}
        @scope.anyComputableRole = true

        promise = @.loadInitialData()

        promise.then () =>
            title = @translate.instant("ADMIN.ROLES.PAGE_TITLE", {projectName: @scope.project.name})
            description = @scope.project.description
            @appMetaService.setAll(title, description)

        promise.then null, @.onInitialDataError.bind(@)

    loadProject: ->
        project = @projectService.project.toJS()
        project = @model.make_model("projects", project)

        if not project.i_am_admin
            @errorHandlingService.permissionDenied()

        @scope.projectId = project.id
        @scope.project = project

        @scope.$emit('project:loaded', project)
        @scope.anyComputableRole = _.some(_.map(project.roles, (point) -> point.computable))

        return project

    loadRoles: ->
        return @rs.roles.list(@scope.projectId).then (roles) =>
            roles = roles.map (role) ->
                role.external_user = false

                return role

            public_permission = {
                "name": @translate.instant("ADMIN.ROLES.EXTERNAL_USER"),
                "permissions": @scope.project.public_permissions,
                "external_user": true
            }

            roles.push(public_permission)

            @scope.roles = roles
            @scope.role = @scope.roles[0]

            if !@scope.project.is_private
                publicPermissions.forEach (permission) =>
                    if !@scope.role.permissions.includes(permission)
                        @scope.role.permissions.push(permission)

            return roles

    loadInitialData: ->
        @.loadProject()
        return @.loadRoles()

    forceLoadProject: () ->
        @rootscope.$broadcast("admin:project-roles:updated")

    setRole: (role) ->
        @scope.role = role
        @scope.$broadcast("role:changed", @scope.role)

    delete: ->
        choices = {}
        for role in @scope.roles
            if role.id != @scope.role.id
                choices[role.id] = role.name

        if _.keys(choices).length == 0
            return @confirm.error(@translate.instant("ADMIN.ROLES.ERROR_DELETE_ALL"))

        title = @translate.instant("ADMIN.ROLES.TITLE_DELETE_ROLE")
        subtitle = @scope.role.name
        replacement = @translate.instant("ADMIN.ROLES.REPLACEMENT_ROLE")
        warning = @translate.instant("ADMIN.ROLES.WARNING_DELETE_ROLE")
        return @confirm.askChoice(title, subtitle, choices, replacement, warning).then (response) =>
            onSuccess = =>
                @.forceLoadProject()
                @.loadRoles().finally =>
                    response.finish()
            onError = =>
                @confirm.notify('error')

            return @repo.remove(@scope.role, {moveTo: response.selected}).then onSuccess, onError

    _enableComputable: =>
        onSuccess = =>
            @confirm.notify("success")
            @.forceLoadProject()

        onError = =>
            @confirm.notify("error")
            @scope.role.revert()

        @repo.save(@scope.role).then onSuccess, onError

    _disableComputable: =>
        askOnSuccess = (response) =>
            onSuccess = =>
                response.finish()
                @confirm.notify("success")
                @.forceLoadProject()
            onError = =>
                response.finish()
                @confirm.notify("error")
                @scope.role.revert()
            @repo.save(@scope.role).then onSuccess, onError

        askOnError = (response) =>
            @scope.role.revert()

        title = @translate.instant("ADMIN.ROLES.DISABLE_COMPUTABLE_ALERT_TITLE")
        subtitle = @translate.instant("ADMIN.ROLES.DISABLE_COMPUTABLE_ALERT_SUBTITLE", {
            roleName: @scope.role.name
        })
        return @confirm.ask(title, subtitle, "").then askOnSuccess, askOnError

    toggleComputable: debounce 2000, ->
        if not @scope.role.computable
            @._disableComputable()
        else
            @._enableComputable()

module.controller("RolesController", RolesController)
