###
# This source code is licensed under the terms of the
# GNU Affero General Public License found in the LICENSE file in
# the root directory of this source tree.
#
# Copyright (c) 2021-present Kaleidos INC
###

taiga = @.taiga

mixOf = @.taiga.mixOf
scopeDefer = @.taiga.scopeDefer
trim = @.taiga.trim
toString = @.taiga.toString
joinStr = @.taiga.joinStr
groupBy = @.taiga.groupBy
bindOnce = @.taiga.bindOnce
debounce = @.taiga.debounce

module = angular.module("taigaAdmin")


#############################################################################
## Project Profile Controller
#############################################################################

class ProjectProfileController extends mixOf(taiga.Controller, taiga.PageMixin)
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
        "tgAppMetaService",
        "$translate",
        "$tgAuth",
        "tgCurrentUserService",
        "tgErrorHandlingService",
        "tgProjectService",
        "$tgModel"
    ]

    constructor: (@scope, @rootscope, @repo, @confirm, @rs, @params, @q, @location, @navUrls,
                  @appMetaService, @translate, @tgAuth, @currentUserService, @errorHandlingService, @projectService, @model) ->
        @scope.project = {}

        promise = @.loadInitialData()

        promise.then =>
            sectionName = @translate.instant( @scope.sectionName)
            title = @translate.instant("ADMIN.PROJECT_PROFILE.PAGE_TITLE", {
                     sectionName: sectionName, projectName: @scope.project.name})
            description = @scope.project.description
            @appMetaService.setAll(title, description)

            @.fillUsersAndRoles(@scope.project.members, @scope.project.roles)

        promise.then null, @.onInitialDataError.bind(@)

        @scope.$on "project:loaded", =>
            sectionName = @translate.instant(@scope.sectionName)
            title = @translate.instant("ADMIN.PROJECT_PROFILE.PAGE_TITLE", {
                     sectionName: sectionName, projectName: @scope.project.name})
            description = @scope.project.description
            @appMetaService.setAll(title, description)

    loadProject: ->
        project = @projectService.project.toJS()
        project = @model.make_model("projects", project)

        if not project.i_am_admin
            @errorHandlingService.permissionDenied()

        @scope.projectId = project.id
        @scope.project = project
        @scope.epicStatusList = _.sortBy(project.epic_statuses, "order")
        @scope.usStatusList = _.sortBy(project.us_statuses, "order")
        @scope.pointsList = _.sortBy(project.points, "order")
        @scope.taskStatusList = _.sortBy(project.task_statuses, "order")
        @scope.issueTypesList = _.sortBy(project.issue_types, "order")
        @scope.issueStatusList = _.sortBy(project.issue_statuses, "order")
        @scope.prioritiesList = _.sortBy(project.priorities, "order")
        @scope.severitiesList = _.sortBy(project.severities, "order")

        scopeDefer @scope, =>
            @scope.$emit('project:loaded', project)

        return project

    loadInitialData: ->
        @.loadProject()
        @scope.canCreatePrivateProjects = @currentUserService.canCreatePrivateProjects().valid

        return @tgAuth.refresh()

module.controller("ProjectProfileController", ProjectProfileController)


#############################################################################
## Project Export Directive
#############################################################################

ProjectExportDirective = ($window, $rs, $confirm, $translate, $analytics) ->
    link = ($scope, $el, $attrs) ->
        buttonsEl = $el.find(".admin-project-export-buttons")
        showButtons = -> buttonsEl.removeClass("hidden")
        hideButtons = -> buttonsEl.addClass("hidden")

        resultEl = $el.find(".admin-project-export-result")
        showResult = -> resultEl.removeClass("hidden")
        hideResult = -> resultEl.addClass("hidden")

        spinnerEl = $el.find(".spin")
        showSpinner = -> spinnerEl.removeClass("hidden")
        hideSpinner = -> spinnerEl.addClass("hidden")

        resultTitleEl = $el.find(".result-title")


        loading_title = $translate.instant("ADMIN.PROJECT_EXPORT.LOADING_TITLE")
        loading_msg = $translate.instant("ADMIN.PROJECT_EXPORT.LOADING_MESSAGE")
        dump_ready_text = -> resultTitleEl.html($translate.instant("ADMIN.PROJECT_EXPORT.DUMP_READY"))
        asyn_message = -> resultTitleEl.html($translate.instant("ADMIN.PROJECT_EXPORT.ASYNC_MESSAGE"))
        syn_message = (url) -> resultTitleEl.html($translate.instant("ADMIN.PROJECT_EXPORT.SYNC_MESSAGE", {
                                                                                                   url: url}))

        setLoadingTitle = -> resultTitleEl.html(loading_title)
        setAsyncTitle = -> resultTitleEl.html(loading_msg)
        setSyncTitle = -> resultTitleEl.html(dump_ready_text)

        resultMessageEl = $el.find(".result-message ")
        setLoadingMessage = -> resultMessageEl.html(loading_msg)
        setAsyncMessage = -> resultMessageEl.html(asyn_message)
        setSyncMessage = (url) -> resultMessageEl.html(syn_message(url))

        showLoadingMode = ->
            showSpinner()
            setLoadingTitle()
            setLoadingMessage()
            hideButtons()
            showResult()

        showExportResultAsyncMode = ->
            hideSpinner()
            setAsyncTitle()
            setAsyncMessage()

        showExportResultSyncMode = (url) ->
            hideSpinner()
            setSyncTitle()
            setSyncMessage(url)

        showErrorMode = ->
            hideSpinner()
            hideResult()
            showButtons()

        $el.on "click", ".button-export", debounce 2000, (event) =>
            event.preventDefault()

            onSuccess = (result) =>
                $analytics.trackEvent("exporter", "export-project", "Exported project", 1)
                if result.status == 202 # Async mode
                    showExportResultAsyncMode()
                else #result.status == 200 # Sync mode
                    dumpUrl = result.data.url
                    showExportResultSyncMode(dumpUrl)
                    $window.open(dumpUrl, "_blank")

            onError = (result) =>
                showErrorMode()

                errorMsg = $translate.instant("ADMIN.PROJECT_EXPORT.ERROR")

                if result.status == 429  # TOO MANY REQUESTS
                    errorMsg = $translate.instant("ADMIN.PROJECT_EXPORT.ERROR_BUSY")
                else if result.data?._error_message
                    errorMsg = $translate.instant("ADMIN.PROJECT_EXPORT.ERROR_BUSY", {
                                                   message: result.data._error_message})

                $confirm.notify("error", errorMsg)

            showLoadingMode()
            $rs.projects.export($scope.projectId).then(onSuccess, onError)

    return {link:link}

module.directive("tgProjectExport", ["$window", "$tgResources", "$tgConfirm", "$translate",
                                     "$tgAnalytics", ProjectExportDirective])


#############################################################################
## CSV Export Controllers
#############################################################################

class CsvExporterController extends taiga.Controller
    @.$inject = [
        "$scope",
        "$rootScope",
        "$tgUrls",
        "$tgConfirm",
        "$tgResources",
        "$translate"
    ]

    constructor: (@scope, @rootscope, @urls, @confirm, @rs, @translate) ->
        @rootscope.$on("project:loaded", @.setCsvUuid)
        @scope.$watch "csvUuid", (value) =>
            if value
                @scope.csvUrl = @urls.resolveAbsolute("#{@.type}-csv", value)
            else
                @scope.csvUrl = ""

    setCsvUuid: =>
        @scope.csvUuid = @scope.project["#{@.type}_csv_uuid"]

    _generateUuid: (response=null) =>
        promise = @rs.projects["regenerate_#{@.type}_csv_uuid"](@scope.projectId)

        promise.then (data) =>
            @scope.csvUuid = data.data?.uuid

        promise.then null, =>
            @confirm.notify("error")

        promise.finally ->
            response.finish() if response
        return promise

    _deleteUuid: (response=null) =>
        promise = @rs.projects["delete_#{@.type}_csv_uuid"](@scope.projectId)

        promise.then (data) =>
            @scope.csvUuid = data.data?.uuid

        promise.then null, =>
            @confirm.notify("error")

        promise.finally ->
            response.finish() if response
        return promise

    regenerateUuid: ->
        if @scope.csvUuid
            title = @translate.instant("ADMIN.REPORTS.REGENERATE_TITLE")
            subtitle = @translate.instant("ADMIN.REPORTS.REGENERATE_SUBTITLE")

            @confirm.ask(title, subtitle).then @._generateUuid
        else
            @._generateUuid()

    deleteUuid: ->
        if @scope.csvUuid
            title = @translate.instant("ADMIN.REPORTS.DELETE_TITLE")
            subtitle = @translate.instant("ADMIN.REPORTS.DELETE_SUBTITLE")

            @confirm.ask(title, subtitle).then @._deleteUuid
        else
            @._deleteUuid()


class CsvExporterEpicsController extends CsvExporterController
    type: "epics"


class CsvExporterUserstoriesController extends CsvExporterController
    type: "userstories"


class CsvExporterTasksController extends CsvExporterController
    type: "tasks"


class CsvExporterIssuesController extends CsvExporterController
    type: "issues"


module.controller("CsvExporterEpicsController", CsvExporterEpicsController)
module.controller("CsvExporterUserstoriesController", CsvExporterUserstoriesController)
module.controller("CsvExporterTasksController", CsvExporterTasksController)
module.controller("CsvExporterIssuesController", CsvExporterIssuesController)


#############################################################################
## CSV Directive
#############################################################################

CsvEpicDirective = ($translate) ->
    link = ($scope) ->
        $scope.sectionTitle = "ADMIN.CSV.SECTION_TITLE_EPIC"

    return {
        controller: "CsvExporterEpicsController",
        controllerAs: "ctrl",
        templateUrl: "admin/project-csv.html",
        link: link,
        scope: true
    }

module.directive("tgCsvEpic", ["$translate", CsvEpicDirective])


CsvUsDirective = ($translate) ->
    link = ($scope) ->
        $scope.sectionTitle = "ADMIN.CSV.SECTION_TITLE_US"

    return {
        controller: "CsvExporterUserstoriesController",
        controllerAs: "ctrl",
        templateUrl: "admin/project-csv.html",
        link: link,
        scope: true
    }

module.directive("tgCsvUs", ["$translate", CsvUsDirective])


CsvTaskDirective = ($translate) ->
    link = ($scope) ->
        $scope.sectionTitle = "ADMIN.CSV.SECTION_TITLE_TASK"

    return {
        controller: "CsvExporterTasksController",
        controllerAs: "ctrl",
        templateUrl: "admin/project-csv.html",
        link: link,
        scope: true
    }

module.directive("tgCsvTask", ["$translate", CsvTaskDirective])


CsvIssueDirective = ($translate) ->
    link = ($scope) ->
        $scope.sectionTitle = "ADMIN.CSV.SECTION_TITLE_ISSUE"

    return {
        controller: "CsvExporterIssuesController",
        controllerAs: "ctrl",
        templateUrl: "admin/project-csv.html",
        link: link,
        scope: true
    }

module.directive("tgCsvIssue", ["$translate", CsvIssueDirective])


AdminProjectRestrictionsDirective = () ->
    return {
        scope: {
            "project": "="
        },
        templateUrl: "admin/admin-project-restrictions.html"
    }

module.directive('tgAdminProjectRestrictions', [AdminProjectRestrictionsDirective])

AdminProjectRequestOwnershipDirective = (lightboxFactory) ->
    return {
        link: (scope) ->
            scope.requestOwnership = () ->
                if scope.canRequest
                    lightboxFactory.create("tg-lb-request-ownership", {
                        "class": "lightbox lightbox-request-ownership"
                    }, {
                        projectId: scope.projectId
                    })

        scope: {
            "canRequest": "=",
            "projectId": "=",
            "owner": "="
        },
        templateUrl: "admin/admin-project-request-ownership.html"
    }

module.directive('tgAdminProjectRequestOwnership', ["tgLightboxFactory", AdminProjectRequestOwnershipDirective])

AdminProjectChangeOwnerDirective = (lightboxFactory) ->
    return {
        link: (scope) ->
            scope.changeOwner = () ->
                lightboxFactory.create("tg-lb-change-owner", {
                    "class": "lightbox lightbox-select-user",
                    "project-id": "projectId",
                    "active-users": "activeUsers",
                    "current-owner-id": "currentOwnerId"
                }, {
                    projectId: scope.projectId,
                    activeUsers: scope.activeUsers,
                    currentOwnerId: scope.owner.id,
                    members: scope.members
                })

        scope: {
            "activeUsers": "="
            "projectId": "="
            "owner": "="
            "members": "="
        },
        templateUrl: "admin/admin-project-change-owner.html"
    }

module.directive('tgAdminProjectChangeOwner', ["tgLightboxFactory", AdminProjectChangeOwnerDirective])
