###
# This source code is licensed under the terms of the
# GNU Affero General Public License found in the LICENSE file in
# the root directory of this source tree.
#
# Copyright (c) 2021-present Kaleidos INC
###

taiga = @.taiga

mixOf = @.taiga.mixOf
toString = @.taiga.toString
joinStr = @.taiga.joinStr
groupBy = @.taiga.groupBy
bindOnce = @.taiga.bindOnce
bindMethods = @.taiga.bindMethods

module = angular.module("taigaIssues")

#############################################################################
## Issue Detail Controller
#############################################################################

class IssueDetailController extends mixOf(taiga.Controller, taiga.PageMixin)
    @.$inject = [
        "$scope",
        "$rootScope",
        "$tgRepo",
        "$tgConfirm",
        "$tgResources",
        "$routeParams",
        "$q",
        "$tgLocation",
        "$log",
        "tgAppMetaService",
        "$tgAnalytics",
        "$tgNavUrls",
        "$translate",
        "$tgQueueModelTransformation",
        "tgErrorHandlingService",
        "tgProjectService",
        "tgAttachmentsFullService",
    ]

    constructor: (@scope, @rootscope, @repo, @confirm, @rs, @params, @q, @location,
                  @log, @appMetaService, @analytics, @navUrls, @translate, @modelTransform,
                  @errorHandlingService, @projectService, @attachmentsFullService) ->
        bindMethods(@)

        @scope.issueRef = @params.issueref
        @scope.sectionName = @translate.instant("ISSUES.SECTION_NAME")
        @scope.attachmentsReady = false
        @scope.$on "attachments:loaded", () =>
            @scope.attachmentsReady = true
        @.initializeEventHandlers()

        promise = @.loadInitialData()

        # On Success
        promise.then =>
            @._setMeta()
            @.initializeOnDeleteGoToUrl()

        # On Error
        promise.then null, @.onInitialDataError.bind(@)

    _setMeta: ->
        title = @translate.instant("ISSUE.PAGE_TITLE", {
            issueRef: "##{@scope.issue.ref}"
            issueSubject: @scope.issue.subject
            projectName: @scope.project.name
        })
        description = @translate.instant("ISSUE.PAGE_DESCRIPTION", {
            issueStatus: @scope.statusById[@scope.issue.status]?.name or "--"
            issueType: @scope.typeById[@scope.issue.type]?.name or "--"
            issueSeverity: @scope.severityById[@scope.issue.severity]?.name or "--"
            issuePriority: @scope.priorityById[@scope.issue.priority]?.name or "--"
            issueDescription: angular.element(@scope.issue.description_html or "").text()
        })
        @appMetaService.setAll(title, description)

    loadAttachments: ->
        @attachmentsFullService.loadAttachments('issue', @scope.issueId, @scope.projectId)

    initializeEventHandlers: ->
        @scope.$on "attachment:create", =>
            @analytics.trackEvent("attachment", "create", "create attachment on issue", 1)

        @scope.$on "promote-issue-to-us:success", =>
            @analytics.trackEvent("issue", "promoteToUserstory", "promote issue to userstory", 1)
            @rootscope.$broadcast("object:updated")
            @.loadIssue()

        @scope.$on "comment:new", =>
            @.loadIssue()

        @scope.$on "custom-attributes-values:edit", =>
            @rootscope.$broadcast("object:updated")

        @scope.$on "assign-sprint-to-issue:success", (ctx, milestoneId) =>
            @scope.issue.milestone = milestoneId
            @rootscope.$broadcast("object:updated")
            if milestoneId
                @.loadSprint()
            else
                @scope.sprint = null

    initializeOnDeleteGoToUrl: ->
       ctx = {project: @scope.project.slug}
       if @scope.project.is_issues_activated
           @scope.onDeleteGoToUrl = @navUrls.resolve("project-issues", ctx)
       else
           @scope.onDeleteGoToUrl = @navUrls.resolve("project", ctx)

    loadProject: ->
        project = @projectService.project.toJS()

        @scope.projectId = project.id
        @scope.project = project
        @scope.$emit('project:loaded', project)
        @scope.statusList = project.issue_statuses
        @scope.statusById = groupBy(project.issue_statuses, (x) -> x.id)
        @scope.typeById = groupBy(project.issue_types, (x) -> x.id)
        @scope.typeList = _.sortBy(project.issue_types, "order")
        @scope.severityList = project.severities
        @scope.severityById = groupBy(project.severities, (x) -> x.id)
        @scope.priorityList = project.priorities
        @scope.priorityById = groupBy(project.priorities, (x) -> x.id)
        return project

    loadIssue: ->
        return @rs.issues.getByRef(@scope.projectId, @params.issueref).then (issue) =>
            @scope.issue = issue
            @scope.issueId = issue.id
            @scope.commentModel = issue

            @.loadAttachments()

            @modelTransform.setObject(@scope, 'issue')

            if @scope.issue.neighbors.previous?.ref?
                ctx = {
                    project: @scope.project.slug
                    ref: @scope.issue.neighbors.previous.ref
                }
                @scope.previousUrl = @navUrls.resolve("project-issues-detail", ctx)

            if @scope.issue.neighbors.next?.ref?
                ctx = {
                    project: @scope.project.slug
                    ref: @scope.issue.neighbors.next.ref
                }
                @scope.nextUrl = @navUrls.resolve("project-issues-detail", ctx)

    loadSprint: ->
        if @scope.issue.milestone
            return @rs.sprints.get(@scope.issue.project, @scope.issue.milestone).then (sprint) =>
                @scope.sprint = sprint
                return sprint

    loadInitialData: ->
        project = @.loadProject()

        @.fillUsersAndRoles(project.members, project.roles)

        return @.loadIssue().then( =>
            if @scope.project.my_permissions.indexOf("view_milestones") != -1
                @.loadSprint()
        )

    ###
    # Note: This methods (onUpvote() and onDownvote()) are related to tg-vote-button.
    #       See app/modules/components/vote-button for more info
    ###
    onUpvote: ->
        onSuccess = =>
            @.loadIssue()
            @rootscope.$broadcast("object:updated")
        onError = =>
            @confirm.notify("error")

        return @rs.issues.upvote(@scope.issueId).then(onSuccess, onError)

    onDownvote: ->
        onSuccess = =>
            @.loadIssue()
            @rootscope.$broadcast("object:updated")
        onError = =>
            @confirm.notify("error")

        return @rs.issues.downvote(@scope.issueId).then(onSuccess, onError)

    ###
    # Note: This methods (onWatch() and onUnwatch()) are related to tg-watch-button.
    #       See app/modules/components/watch-button for more info
    ###
    onWatch: ->
        onSuccess = =>
            @.loadIssue()
            @rootscope.$broadcast("object:updated")
        onError = =>
            @confirm.notify("error")

        return @rs.issues.watch(@scope.issueId).then(onSuccess, onError)

    onUnwatch: ->
        onSuccess = =>
            @.loadIssue()
            @rootscope.$broadcast("object:updated")
        onError = =>
            @confirm.notify("error")

        return @rs.issues.unwatch(@scope.issueId).then(onSuccess, onError)

module.controller("IssueDetailController", IssueDetailController)


