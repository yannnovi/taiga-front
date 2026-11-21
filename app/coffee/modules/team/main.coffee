###
# This source code is licensed under the terms of the
# GNU Affero General Public License found in the LICENSE file in
# the root directory of this source tree.
#
# Copyright (c) 2021-present Kaleidos INC
###

taiga = @.taiga

mixOf = @.taiga.mixOf

module = angular.module("taigaTeam")

#############################################################################
## Team Controller
#############################################################################

class TeamController extends mixOf(taiga.Controller, taiga.PageMixin)
    @.$inject = [
        "$scope",
        "$rootScope",
        "$tgRepo",
        "$tgResources",
        "$routeParams",
        "$q",
        "$location",
        "$tgNavUrls",
        "tgAppMetaService",
        "$tgAuth",
        "$translate",
        "tgProjectService",
        "tgErrorHandlingService"
    ]

    constructor: (@scope, @rootscope, @repo, @rs, @params, @q, @location, @navUrls, @appMetaService, @auth,
                  @translate, @projectService, @errorHandlingService) ->
        @scope.sectionName = "TEAM.SECTION_NAME"

        promise = @.loadInitialData()

        # On Success
        promise.then =>
            title = @translate.instant("TEAM.PAGE_TITLE", {projectName: @scope.project.name})
            description = @translate.instant("TEAM.PAGE_DESCRIPTION", {
                projectName: @scope.project.name,
                projectDescription: @scope.project.description
            })
            @appMetaService.setAll(title, description)

        # On Error
        promise.then null, @.onInitialDataError.bind(@)

    setQuery: (q) ->
        @scope.filtersQ = q

    setRole: (role) ->
        if role
            @scope.filtersRole = role
        else
            @scope.filtersRole = null

    loadMembers: ->
        user = @auth.getUser()

        # Calculate totals
        @scope.totals = {}
        for member in @scope.activeUsers
            @scope.totals[member.id] = 0

        # Get current user
        @scope.currentUser = _.find(@scope.activeUsers, {id: user?.id})

        # Get member list without current user
        @scope.memberships = _.reject(@scope.activeUsers, {id: user?.id})

    loadProject: ->
        project = @projectService.project.toJS()

        @scope.projectId = project.id
        @scope.project = project
        @scope.$emit('project:loaded', project)

        @scope.issuesEnabled = project.is_issues_activated
        @scope.tasksEnabled = project.is_kanban_activated or project.is_backlog_activated
        @scope.wikiEnabled = project.is_wiki_activated
        @scope.owner = project.owner.id

        return project

    loadMemberStats: ->
        return @rs.projects.memberStats(@scope.projectId).then (stats) =>
          totals = {}
          _.forEach @scope.totals, (total, userId) =>
              vals = _.map(stats, (memberStats, statsKey) -> memberStats[userId])
              total = _.reduce(vals, (sum, el) -> sum + el)
              @scope.totals[userId] = total

          @scope.stats = @._processStats(stats)
          @scope.stats.totals = @scope.totals

    _processStat: (stat) ->
        max = _.max(_.toArray(stat))
        min = _.min(_.toArray(stat))

        singleStat = Object()
        for own key, value of stat
            if value == min
                singleStat[key] = 0.1
            else if value == max
                singleStat[key] = 1
            else
                singleStat[key] = (value * 0.5) / max

        return singleStat

    _processStats: (stats) ->
        for key,value of stats
            stats[key] = @._processStat(value)
        return stats

    loadInitialData: ->
        project = @.loadProject()

        @.fillUsersAndRoles(project.members, project.roles)
        @.loadMembers()

        userRoles = _.map @scope.users, (user) -> user.role

        @scope.roles = _.filter @scope.roles, (role) -> userRoles.indexOf(role.id) != -1

        return @.loadMemberStats()

module.controller("TeamController", TeamController)
