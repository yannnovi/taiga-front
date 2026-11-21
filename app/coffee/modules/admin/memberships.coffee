###
# This source code is licensed under the terms of the
# GNU Affero General Public License found in the LICENSE file in
# the root directory of this source tree.
#
# Copyright (c) 2021-present Kaleidos INC
###

taiga = @.taiga

mixOf = @.taiga.mixOf
bindMethods = @.taiga.bindMethods

module = angular.module("taigaAdmin")


#############################################################################
## Project Memberships Controller
#############################################################################

class MembershipsController extends mixOf(taiga.Controller, taiga.PageMixin, taiga.FiltersMixin)
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
        "$tgAnalytics",
        "tgAppMetaService",
        "$translate",
        "$tgAuth",
        "tgLightboxFactory",
        "tgErrorHandlingService",
        "tgProjectService"
    ]

    constructor: (@scope, @rootscope, @repo, @confirm, @rs, @params, @q, @location, @navUrls, @analytics,
                  @appMetaService, @translate, @auth, @lightboxFactory, @errorHandlingService, @projectService) ->
        bindMethods(@)

        @scope.project = {}
        @scope.filters = {}

        promise = @.loadInitialData()

        promise.then  =>
           title = @translate.instant("ADMIN.MEMBERSHIPS.PAGE_TITLE", {projectName:  @scope.project.name})
           description = @scope.project.description
           @appMetaService.setAll(title, description)

        promise.then null, @.onInitialDataError.bind(@)

        @scope.$on "membersform:new:success", =>
            @.loadInitialData()
            @analytics.trackEvent("membership", "create", "create memberships on admin", 1)

    loadProject: ->
        project = @projectService.project.toJS()

        if not project.i_am_admin
            @errorHandlingService.permissionDenied()

        @scope.projectId = project.id
        @scope.project = project

        @scope.canAddUsers = project.max_memberships == null || project.max_memberships > project.total_memberships

        @scope.$emit('project:loaded', project)
        return project

    loadMembers: ->
        httpFilters = @.getUrlFilters()

        return @rs.memberships.list(@scope.projectId, httpFilters).then (data) =>
            @scope.memberships = _.filter(data.models, (membership) ->
                                    membership.user == null or membership.is_user_active)

            _.map(@scope.memberships, (member) =>
                if member.is_owner
                    @scope.projectOwnerEmail = member.user_email
            )

            @scope.page = data.current
            @scope.count = data.count
            @scope.paginatedBy = data.paginatedBy
            return data

    loadInitialData: ->
        @.loadProject()

        return @q.all([
            @.loadMembers(),
            @auth.refresh()
        ])

    getUrlFilters: ->
        filters = _.pick(@location.search(), "page")
        filters.page = 1 if not filters.page
        return filters

    # Actions

    addNewMembers:  ->
        @lightboxFactory.create(
            'tg-lb-add-members',
            {
                "class": "lightbox lightbox-add-member",
                "project": "project"
            },
            {
                "project": @scope.project
            }
        )

    showLimitUsersWarningMessage: ->
        title = @translate.instant("ADMIN.MEMBERSHIPS.LIMIT_USERS_WARNING")
        message = @translate.instant("ADMIN.MEMBERSHIPS.LIMIT_USERS_WARNING_MESSAGE", {
            members: @scope.project.max_memberships
        })
        icon = "/" + window._version + "/svg/icons/team-question.svg"
        @confirm.success(title, message, {
            name: icon,
            type: "img"
        })

module.controller("MembershipsController", MembershipsController)
