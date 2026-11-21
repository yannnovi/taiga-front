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

module = angular.module("taigaEpics")

#############################################################################
## Epic Detail Controller
#############################################################################

class EpicDetailController extends mixOf(taiga.Controller, taiga.PageMixin)
    @.$inject = [
        "$scope",
        "$rootScope",
        "$tgRepo",
        "$tgConfirm",
        "$tgResources",
        "tgResources"
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

    constructor: (@scope, @rootscope, @repo, @confirm, @rs, @rs2, @params, @q, @location,
                  @log, @appMetaService, @analytics, @navUrls, @translate, @modelTransform, @errorHandlingService, @projectService, @attachmentsFullService) ->
        bindMethods(@)

        @scope.epicRef = @params.epicref
        @scope.sectionName = @translate.instant("EPIC.SECTION_NAME")
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
        title = @translate.instant("EPIC.PAGE_TITLE", {
            epicRef: "##{@scope.epic.ref}"
            epicSubject: @scope.epic.subject
            projectName: @scope.project.name
        })
        description = @translate.instant("EPIC.PAGE_DESCRIPTION", {
            epicStatus: @scope.statusById[@scope.epic.status]?.name or "--"
            epicDescription: angular.element(@scope.epic.description_html or "").text()
        })
        @appMetaService.setAll(title, description)

    loadAttachments: ->
        @attachmentsFullService.loadAttachments('epic', @scope.epicId, @scope.projectId)

    initializeEventHandlers: ->
        @scope.$on "attachment:create", =>
            @analytics.trackEvent("attachment", "create", "create attachment on epic", 1)

        @scope.$on "comment:new", =>
            @.loadEpic()

        @scope.$on "custom-attributes-values:edit", =>
            @rootscope.$broadcast("object:updated")

    initializeOnDeleteGoToUrl: ->
       ctx = {project: @scope.project.slug}
       @scope.onDeleteGoToUrl = @navUrls.resolve("project-epics", ctx)

    loadProject: ->
        project = @projectService.project.toJS()

        @scope.projectId = project.id
        @scope.project = project
        @scope.immutableProject = @projectService.project
        @scope.$emit('project:loaded', project)
        @scope.statusList = project.epic_statuses
        @scope.statusById = groupBy(project.epic_statuses, (x) -> x.id)
        return project

    loadEpic: ->
        return @rs.epics.getByRef(@scope.projectId, @params.epicref).then (epic) =>
            @scope.epic = epic
            @scope.immutableEpic = Immutable.fromJS(epic._attrs)
            @scope.epicId = epic.id
            @scope.commentModel = epic

            @.loadAttachments()

            @modelTransform.setObject(@scope, 'epic')

            if @scope.epic.neighbors.previous?.ref?
                ctx = {
                    project: @scope.project.slug
                    ref: @scope.epic.neighbors.previous.ref
                }
                @scope.previousUrl = @navUrls.resolve("project-epics-detail", ctx)

            if @scope.epic.neighbors.next?.ref?
                ctx = {
                    project: @scope.project.slug
                    ref: @scope.epic.neighbors.next.ref
                }
                @scope.nextUrl = @navUrls.resolve("project-epics-detail", ctx)

    loadUserstories: ->
          return @rs2.userstories.listInEpic(@scope.epicId).then (data) =>
              @scope.userstories = data

    loadInitialData: ->
        project = @.loadProject()

        @.fillUsersAndRoles(project.members, project.roles)
        @.loadEpic().then(=> @.loadUserstories())

    ###
    # Note: This methods (onUpvote() and onDownvote()) are related to tg-vote-button.
    #       See app/modules/components/vote-button for more info
    ###
    onUpvote: ->
        onSuccess = =>
            @.loadEpic()
            @rootscope.$broadcast("object:updated")
        onError = =>
            @confirm.notify("error")

        return @rs.epics.upvote(@scope.epicId).then(onSuccess, onError)

    onDownvote: ->
        onSuccess = =>
            @.loadEpic()
            @rootscope.$broadcast("object:updated")
        onError = =>
            @confirm.notify("error")

        return @rs.epics.downvote(@scope.epicId).then(onSuccess, onError)

    ###
    # Note: This methods (onWatch() and onUnwatch()) are related to tg-watch-button.
    #       See app/modules/components/watch-button for more info
    ###
    onWatch: ->
        onSuccess = =>
            @.loadEpic()
            @rootscope.$broadcast("object:updated")
        onError = =>
            @confirm.notify("error")

        return @rs.epics.watch(@scope.epicId).then(onSuccess, onError)

    onUnwatch: ->
        onSuccess = =>
            @.loadEpic()
            @rootscope.$broadcast("object:updated")
        onError = =>
            @confirm.notify("error")

        return @rs.epics.unwatch(@scope.epicId).then(onSuccess, onError)

    onSelectColor: (color) ->
        onSelectColorSuccess = () =>
            @rootscope.$broadcast("object:updated")
            @confirm.notify('success')

        onSelectColorError = () =>
            @confirm.notify('error')

        transform = @modelTransform.save (epic) ->
            epic.color = color
            return epic

        return transform.then(onSelectColorSuccess, onSelectColorError)

module.controller("EpicDetailController", EpicDetailController)


