###
# This source code is licensed under the terms of the
# GNU Affero General Public License found in the LICENSE file in
# the root directory of this source tree.
#
# Copyright (c) 2021-present Kaleidos INC
###

taiga = @.taiga

mixOf = @.taiga.mixOf
trim = @.taiga.trim
toString = @.taiga.toString
joinStr = @.taiga.joinStr
groupBy = @.taiga.groupBy
bindOnce = @.taiga.bindOnce

module = angular.module("taigaAdmin")

#############################################################################
## Project values section Controller
#############################################################################

class ProjectValuesSectionController extends mixOf(taiga.Controller, taiga.PageMixin)
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
        "tgErrorHandlingService",
        "tgProjectService"
    ]

    constructor: (@scope, @rootscope, @repo, @confirm, @rs, @params, @q, @location, @navUrls,
                  @appMetaService, @translate, @errorHandlingService, @projectService) ->
        @scope.project = {}

        @scope.$on "project:load", () =>
            @projectService.fetchProject().then () =>
                @.loadProject()

        @.loadInitialData()

        sectionName = @translate.instant(@scope.sectionName)

        title = @translate.instant("ADMIN.PROJECT_VALUES.PAGE_TITLE", {
            "sectionName": sectionName,
            "projectName": @scope.project.name
        })

        description = @scope.project.description
        @appMetaService.setAll(title, description)

    loadProject: ->
        project = @projectService.project.toJS()

        if not project.i_am_admin
            @errorHandlingService.permissionDenied()

        @scope.projectId = project.id
        @scope.project = project
        @scope.$emit('project:loaded', project)
        return project

    loadInitialData: ->
        promise = @.loadProject()
        return promise

module.controller("ProjectValuesSectionController", ProjectValuesSectionController)

#############################################################################
## Project swimlanes Controller
#############################################################################

class ProjectSwimlanesValuesController extends taiga.Controller
    @.$inject = [
        "$scope",
        "$rootScope",
        "$tgRepo",
        "$translate"
        "$tgConfirm",
        "$tgResources",
        "tgProjectService"
    ]

    constructor: (@scope, @rootscope, @repo, @translate, @confirm, @rs, @projectService) ->
        @scope.$on "swimlane:load", => @.loadSwimlanes()

        unwatch = @scope.$watch "resource", (resource) =>
            if resource
                @.loadSwimlanes()
                unwatch()

    addSwimlane: =>
        promise = @rs[@scope.resource].create(@scope.projectId, @scope.swimlane.name)

        promise.success (values) =>
            @scope.swimlaneAdded()
            @.loadSwimlanes()
            @rootscope.$broadcast("project:load")

        promise.error =>
            @confirm.notify('light-error', @translate.instant("ADMIN.PROJECT_KANBAN_OPTIONS.ACTION_ADD_SWIMLANE"))
            @scope.hideSwimlaneForm()

    updateSwimlane: (swimlane, name) =>
        return @rs[@scope.resource].edit(swimlane.id, name).then (values) =>
            @.loadSwimlanes()
            @rootscope.$broadcast("project:load")

    setDefaultSwimlane: (swimlane) =>
        return @rs.projects.patch_default_swimlane(@scope.projectId, swimlane.id).then () =>
            @rootscope.$broadcast("project:load")

    updatedSwimlanePosition: (swimlane, position) =>
        prevSwimlane = @scope.values.find((value) ->
            return value.id == swimlane.id
        )

        if (prevSwimlane.order == position)
            return

        swimlanesOrderArrayFiltered = @scope.values.filter((value, index) =>
            return value.id != swimlane.id
        )

        swimlanesOrderArrayFiltered.splice(position, 0, swimlane)

        newSwimlanesOrder = swimlanesOrderArrayFiltered.map((swimlane, index) =>
            return [
                swimlane.id,
                index
            ]
        )

        return @rs[@scope.resource].bulkUpdateOrder(@scope.projectId, newSwimlanesOrder).then (values) =>
            @.loadSwimlanes()

    filterArchivedProjectStatuses: () =>
        return @.scope.project.us_statuses.filter((status) =>
            return status.is_archived != true
        )

    filterArchivedSwimlaneStatus: (swimlane) =>
        return swimlane.statuses.filter((status) =>
            return status.is_archived != true
        )

    loadSwimlanes: =>
        return @rs[@scope.resource].list(@scope.projectId).then (values) =>
            @scope.values = values

    removeSwimlane: (swimlaneId, moveTo) =>
        return @rs[@scope.resource].delete(swimlaneId, moveTo).then () =>
            @.loadSwimlanes()
            @rootscope.$broadcast("project:load")

module.controller("ProjectSwimlanesValuesController", ProjectSwimlanesValuesController)

#############################################################################
## Swimlanes directive
#############################################################################

ProjectSwimlanesValue = ($timeout) ->

    link = ($scope, $el, $attrs, $ctrl) ->
        $ctrl = $el.controller()

        $scope.isFormVisible = false
        $scope.isNewSwimlane = false
        $scope.swimlane = {
            name: ''
        }

        $scope.swimlaneAdded = () ->
            $scope.swimlane = {
                name: ''
            }
            $scope.isNewSwimlane = true
            $scope.isFormVisible = false
            setTimeout () ->
                $scope.isNewSwimlane = false
                $scope.$apply()
            , 10000

        $scope.displaySwimlaneForm = () ->
            $scope.isFormVisible = true
            $timeout () -> $el.find("#admin-swimlanes-form-input").focus()

        $scope.hideSwimlaneForm = () ->
            $scope.isFormVisible = false
            $scope.swimlane = {
                name: ''
            }

        $scope.$on "$destroy", ->
            $el.off()

    return {
        link:link
    }

module.directive("tgProjectSwimlanesValues", ["$timeout", ProjectSwimlanesValue])

#############################################################################
## Swimlanes single directive
#############################################################################

ProjectSwimlanesSingle = ($translate, $confirm, $animate) ->

    link = ($scope, $el, $attrs, $ctrl) ->
        $ctrl = $el.controller()

        $scope.displaySwimlaneSingleForm = false
        $scope.swimlaneSingleForm = {
            name: ''
        }

        $scope.updateSwimlane = (swimlane) ->
            $scope.displaySwimlaneSingleForm = false
            $ctrl.updateSwimlane(swimlane, $scope.swimlaneSingleForm.name)

        $scope.setDefaultSwimlane = (swimlane) ->
            $ctrl.setDefaultSwimlane(swimlane)

        $scope.getDefaultTitle = (swimlane) ->
            if (swimlane.id == $scope.project.default_swimlane)
                return $translate.instant("LIGHTBOX.ADMIN_KANBAN_POWERUPS.DEFAULT_SWIMLANE")
            else
                return $translate.instant("LIGHTBOX.ADMIN_KANBAN_POWERUPS.SET_DEFAULT_SWIMLANE")

        $scope.removeSwimlaneTitle = (swimlane) ->
            if (swimlane.id == $scope.project.default_swimlane)
                return $translate.instant("LIGHTBOX.ADMIN_KANBAN_POWERUPS.DISABLE_DELETE_SWIMLANE")

        $scope.editSwimlaneSingleForm = () ->
            $scope.displaySwimlaneSingleForm = true

        $scope.cancelEditSwimlaneSingleForm = () ->
            $scope.displaySwimlaneSingleForm = false

        $scope.removeSwimlaneDialog = (event, swimlane) =>
            title = $translate.instant("LIGHTBOX.ADMIN_KANBAN_POWERUPS.TITLE_ACTION_DELETE_SWIMLANE")

            $animate.on("leave", $el[0], (element, phase) ->
                if(phase == "close")
                    $animate.off("leave", $el[0])

                    $ctrl.scope.$evalAsync () =>
                        $ctrl.scope.deletingSwimlane = false
            );

            if $scope.values.length > 1
                subtitle = $translate.instant("LIGHTBOX.ADMIN_KANBAN_POWERUPS.SUBTITLE_ACTION_DELETE_SWIMLANE_OPTIONS", {swimlane:  swimlane.name})
                replacement = $translate.instant("LIGHTBOX.ADMIN_KANBAN_POWERUPS.SUBTITLE_ACTION_DELETE_SWIMLANE_REPLACEMENT")

                choices = {}
                _.each $scope.values, (option) ->
                    if swimlane.id != option.id
                        choices[option.id] = option.name

                $confirm.askChoice(title, subtitle, choices, replacement).then (response) ->
                    $ctrl.scope.deletingSwimlane = true

                    $ctrl.removeSwimlane(swimlane.id, response.selected)
                    response.finish()
            else
                subtitle = $translate.instant("LIGHTBOX.ADMIN_KANBAN_POWERUPS.SUBTITLE_ACTION_DELETE_SWIMLANE_LAST")
                $confirm.askDelete(title, subtitle).then (response) ->
                    $ctrl.scope.deletingSwimlane = true

                    $ctrl.removeSwimlane(swimlane.id)
                    response.finish()

    return {link:link}

module.directive("tgProjectSwimlanesSingle", ["$translate", "$tgConfirm", "$animate", ProjectSwimlanesSingle])


#############################################################################
## Swimlanes sortable directive
#############################################################################

SortableSwimlanes = () ->

    link = ($scope, $el, $attrs, $ctrl) ->
        $ctrl = $el.controller()
        itemEl = null
        tdom = $el.find(".sortable")

        drake = dragula([tdom[0]], {
            direction: 'vertical',
            copySortSource: false,
            copy: false,
            mirrorContainer: tdom[0],
        })

        drake.on 'dragend', (item) ->
            itemEl = $(item)
            itemValue = itemEl.scope().value
            newIndex = itemEl.index()

            $scope.$apply () ->
                $ctrl.updatedSwimlanePosition(itemValue, newIndex)

        $scope.$on "$destroy", ->
            $el.off()
            drake.destroy()

    return {link:link}

module.directive("tgSortableSwimlanes", [SortableSwimlanes])

# #############################################################################
# ## Swimlanes wip directive
# #############################################################################

ProjectSwimlanesWipDirective = () ->

    link = ($scope, $el, $attrs, $model) ->
        $scope.wipClosed = false

        $scope.toggleWipVisibility = () ->
            $scope.wipClosed = !$scope.wipClosed

    return {
        link: link
    }

module.directive("tgProjectSwimlanesWip", ProjectSwimlanesWipDirective)
