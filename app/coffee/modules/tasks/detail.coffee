###
# This source code is licensed under the terms of the
# GNU Affero General Public License found in the LICENSE file in
# the root directory of this source tree.
#
# Copyright (c) 2021-present Kaleidos INC
###

taiga = @.taiga

mixOf = @.taiga.mixOf
groupBy = @.taiga.groupBy
bindMethods = @.taiga.bindMethods

module = angular.module("taigaTasks")


#############################################################################
## Task Detail Controller
#############################################################################

class TaskDetailController extends mixOf(taiga.Controller, taiga.PageMixin)
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
        "$tgNavUrls",
        "$tgAnalytics",
        "$translate",
        "$tgQueueModelTransformation",
        "tgErrorHandlingService",
        "tgProjectService",
        "tgAttachmentsFullService",
    ]

    constructor: (@scope, @rootscope, @repo, @confirm, @rs, @params, @q, @location,
                  @log, @appMetaService, @navUrls, @analytics, @translate, @modelTransform, @errorHandlingService, @projectService, @attachmentsFullService) ->
        bindMethods(@)

        @scope.taskRef = @params.taskref
        @scope.sectionName = @translate.instant("TASK.SECTION_NAME")
        @scope.attachmentsReady = false
        @scope.$on "attachments:loaded", () =>
            @scope.attachmentsReady = true
        @.initializeEventHandlers()

        promise = @.loadInitialData()

        promise.then () =>
            @._setMeta()
            @.initializeOnDeleteGoToUrl()

        promise.then null, @.onInitialDataError.bind(@)

    _setMeta: ->
        title = @translate.instant("TASK.PAGE_TITLE", {
            taskRef: "##{@scope.task.ref}"
            taskSubject: @scope.task.subject
            projectName: @scope.project.name
        })
        description = @translate.instant("TASK.PAGE_DESCRIPTION", {
            taskStatus: @scope.statusById[@scope.task.status]?.name or "--"
            taskDescription: angular.element(@scope.task.description_html or "").text()
        })
        @appMetaService.setAll(title, description)

    loadAttachments: ->
        @attachmentsFullService.loadAttachments('task', @scope.taskId, @scope.projectId)

    initializeEventHandlers: ->
        @scope.$on "promote-task-to-us:success", (e, ref) =>
            @analytics.trackEvent("task", "promoteToUserstory", "promote task to userstory", 1)
            ctx = {project: @scope.project.slug, ref: ref}
            @location.path(@navUrls.resolve("project-userstories-detail", ctx))

        @scope.$on "attachment:create", =>
            @analytics.trackEvent("attachment", "create", "create attachment on task", 1)
        @scope.$on "custom-attributes-values:edit", =>
            @rootscope.$broadcast("object:updated")
        @scope.$on "comment:new", =>
            @.loadTask()

    initializeOnDeleteGoToUrl: ->
        ctx = {project: @scope.project.slug}
        @scope.onDeleteGoToUrl = @navUrls.resolve("project", ctx)
        if @scope.project.is_backlog_activated
            if @scope.task.milestone
                ctx.sprint = @scope.sprint.slug
                @scope.onDeleteGoToUrl = @navUrls.resolve("project-taskboard", ctx)
            else if @scope.task.us
                ctx.ref = @scope.us.ref
                @scope.onDeleteGoToUrl = @navUrls.resolve("project-userstories-detail", ctx)
        else if @scope.project.is_kanban_activated
            if @scope.us
                ctx.ref = @scope.us.ref
                @scope.onDeleteGoToUrl = @navUrls.resolve("project-userstories-detail", ctx)

    loadProject: ->
        project = @projectService.project.toJS()

        @scope.projectId = project.id
        @scope.project = project
        @scope.$emit('project:loaded', project)
        @scope.statusList = project.task_statuses
        @scope.statusById = groupBy(project.task_statuses, (x) -> x.id)
        return project

    loadTask: ->
        return @rs.tasks.getByRef(@scope.projectId, @params.taskref).then (task) =>
            @scope.task = task
            @scope.taskId = task.id
            @scope.commentModel = task

            @.loadAttachments()

            window.legacyChannel.next({
                type: 'SET_DETAIL_OBJ',
                value: task._attrs
            })

            @modelTransform.setObject(@scope, 'task')

            if @scope.task.neighbors.previous?.ref?
                ctx = {
                    project: @scope.project.slug
                    ref: @scope.task.neighbors.previous.ref
                }
                @scope.previousUrl = @navUrls.resolve("project-tasks-detail", ctx)

            if @scope.task.neighbors.next?.ref?
                ctx = {
                    project: @scope.project.slug
                    ref: @scope.task.neighbors.next.ref
                }
                @scope.nextUrl = @navUrls.resolve("project-tasks-detail", ctx)
            return task

    loadSprint: ->
        if @scope.task.milestone
            return @rs.sprints.get(@scope.task.project, @scope.task.milestone).then (sprint) =>
                @scope.sprint = sprint
                return sprint

    loadUserStory: ->
        if @scope.task.user_story
            return @rs.userstories.get(@scope.task.project, @scope.task.user_story).then (us) =>
                @scope.us = us
                return us

    loadInitialData: ->
        project = @.loadProject()

        @.fillUsersAndRoles(project.members, project.roles)
        return @.loadTask().then(=> @q.all([@.loadSprint(), @.loadUserStory()]))

    ###
    # Note: This methods (onUpvote() and onDownvote()) are related to tg-vote-button.
    #       See app/modules/components/vote-button for more info
    ###
    onUpvote: ->
        onSuccess = =>
            @.loadTask()
            @rootscope.$broadcast("object:updated")
        onError = =>
            @confirm.notify("error")

        return @rs.tasks.upvote(@scope.taskId).then(onSuccess, onError)

    onDownvote: ->
        onSuccess = =>
            @.loadTask()
            @rootscope.$broadcast("object:updated")
        onError = =>
            @confirm.notify("error")

        return @rs.tasks.downvote(@scope.taskId).then(onSuccess, onError)

    ###
    # Note: This methods (onWatch() and onUnwatch()) are related to tg-watch-button.
    #       See app/modules/components/watch-button for more info
    ###
    onWatch: ->
        onSuccess = =>
            @.loadTask()
            @rootscope.$broadcast("object:updated")
        onError = =>
            @confirm.notify("error")

        return @rs.tasks.watch(@scope.taskId).then(onSuccess, onError)

    onUnwatch: ->
        onSuccess = =>
            @.loadTask()
            @rootscope.$broadcast("object:updated")
        onError = =>
            @confirm.notify("error")

        return @rs.tasks.unwatch(@scope.taskId).then(onSuccess, onError)

module.controller("TaskDetailController", TaskDetailController)


