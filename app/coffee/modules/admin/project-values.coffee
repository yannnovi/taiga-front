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
debounce = @.taiga.debounce

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

#############################################################################
## Tags Controller
#############################################################################

class ProjectTagsController extends taiga.Controller
    @.$inject = [
        "$scope",
        "$rootScope",
        "$tgRepo",
        "$tgConfirm",
        "$tgResources",
        "$tgModel",
        "tgProjectService"
    ]

    constructor: (@scope, @rootscope, @repo, @confirm, @rs, @model, @projectService) ->
        @.loading = true
        @.loadTags()

    loadTags: =>
        project = @projectService.project.toJS()
        return @rs.projects.tagsColors(project.id).then (tags) =>
            @scope.projectTagsAll = _.map tags.getAttrs(), (color, name) =>
                @model.make_model('tag', {name: name, color: color})
            @.filterAndSortTags()
            @.loading = false

    filterAndSortTags: =>
        @scope.projectTags = _.sortBy @scope.projectTagsAll, (it) -> it.name.toLowerCase()

        @scope.projectTags = _.filter(
            @scope.projectTags,
            (tag) => tag.name.indexOf(@scope.tagsFilter.name) != -1
        )

    createTag: (tag, color) =>
        return @rs.projects.createTag(@scope.projectId, tag, color)

    editTag: (from_tag, to_tag, color) =>
        if from_tag == to_tag
            to_tag = null

        return @rs.projects.editTag(@scope.projectId, from_tag, to_tag, color)

    deleteTag: (tag) =>
        @scope.loadingDelete = true
        return @rs.projects.deleteTag(@scope.projectId, tag).finally =>
            @scope.loadingDelete = false

    startMixingTags: (tag) =>
        @scope.mixingTags.toTag = tag.name

    toggleMixingFromTags: (tag) =>
        if tag.name != @scope.mixingTags.toTag
            index = @scope.mixingTags.fromTags.indexOf(tag.name)
            if index == -1
                @scope.mixingTags.fromTags.push(tag.name)
            else
                @scope.mixingTags.fromTags.splice(index, 1)

    confirmMixingTags: () =>
        toTag = @scope.mixingTags.toTag
        fromTags = @scope.mixingTags.fromTags
        @scope.loadingMixing = true
        @rs.projects.mixTags(@scope.projectId, toTag, fromTags)
            .then =>
                @.cancelMixingTags()
                @.loadTags()
            .finally =>
                @scope.loadingMixing = false

    cancelMixingTags: () =>
        @scope.mixingTags.toTag = null
        @scope.mixingTags.fromTags = []

    mixingClass: (tag) =>
        if @scope.mixingTags.toTag != null
            if tag.name == @scope.mixingTags.toTag
                return "mixing-tags-to"
            else if @scope.mixingTags.fromTags.indexOf(tag.name) != -1
                return "mixing-tags-from"

module.controller("ProjectTagsController", ProjectTagsController)


#############################################################################
## Tags directive
#############################################################################

ProjectTagsDirective = ($log, $repo, $confirm, $location, animationFrame, $translate, $rootscope) ->
    link = ($scope, $el, $attrs) ->
        $window = $(window)
        $ctrl = $el.controller()
        valueType = $attrs.type
        objName = $attrs.objname

        initializeNewValue = ->
            $scope.newValue = {
                "tag": ""
                "color": ""
            }

        initializeTagsFilter = ->
            $scope.tagsFilter = {
                "name": ""
            }

        initializeMixingTags = ->
            $scope.mixingTags = {
                "toTag": null,
                "fromTags": []
            }

        initializeTextTranslations = ->
            $scope.addNewElementText = $translate.instant("ADMIN.PROJECT_VALUES_TAGS.ACTION_ADD")

        initializeNewValue()
        initializeTagsFilter()
        initializeMixingTags()
        initializeTextTranslations()

        $rootscope.$on "$translateChangeEnd", ->
            $scope.$evalAsync(initializeTextTranslations)

        goToBottomList = (focus = false) =>
            table = $el.find(".table-main")

            $(document.body).scrollTop(table.offset().top + table.height())

            if focus
                $el.find(".new-value input:visible").first().focus()

        saveValue = (target) ->
            formEl = target.parents("form")
            form = formEl.checksley()
            return if not form.validate()

            tag = formEl.scope().tag
            originalTag = tag.clone()
            originalTag.revert()

            $scope.loadingEdit = true
            promise = $ctrl.editTag(originalTag.name, tag.name, tag.color)
            promise.then ->
                $ctrl.loadTags().then ->
                    row = target.parents(".row.table-main")
                    row.addClass("hidden")
                    $scope.loadingEdit = false
                    $rootscope.$broadcast('tags:updated')
                    row.siblings(".visualization").removeClass('hidden')

            promise.then null, (response) ->
                $scope.loadingEdit = false
                form.setErrors(response.data)

        saveNewValue = (target) ->
            formEl = target.parents("form")
            formEl = target
            form = formEl.checksley()
            return if not form.validate()

            $scope.loadingCreate = true
            promise = $ctrl.createTag($scope.newValue.tag, $scope.newValue.color)
            promise.then (data) ->
                $ctrl.loadTags().then ->
                    $scope.loadingCreate = false
                    target.addClass("hidden")
                    $rootscope.$broadcast('tags:updated')
                    initializeNewValue()

            promise.then null, (response) ->
                $scope.loadingCreate = false
                form.setErrors(response.data)

        cancel = (target) ->
            row = target.parents(".row.table-main")
            formEl = target.parents("form")
            tag = formEl.scope().tag

            $scope.$apply ->
                row.addClass("hidden")
                tag.revert()
                row.siblings(".visualization").removeClass('hidden')

        $scope.$watch "tagsFilter.name", (tagsFilter) ->
            $ctrl.filterAndSortTags()

        $window.on "keyup", (event) ->
            if event.keyCode == 27
                $scope.$apply ->
                    initializeMixingTags()

        $el.on "click", ".show-add-new", (event) ->
            event.preventDefault()
            $el.find(".new-value").removeClass('hidden')

        $el.on "click", ".add-new", debounce 2000, (event) ->
            event.preventDefault()
            target = $el.find(".new-value")
            saveNewValue(target)

        $el.on "click", ".delete-new", (event) ->
            event.preventDefault()
            $el.find(".new-value").addClass("hidden")
            initializeNewValue()

        $el.on "click", ".mix-tags", (event) ->
            event.preventDefault()
            target = angular.element(event.currentTarget)
            $scope.$apply ->
                $ctrl.startMixingTags(target.parents('form').scope().tag)

        $el.on "click", ".mixing-row", (event) ->
            event.preventDefault()
            target = angular.element(event.currentTarget)
            $scope.$apply ->
                $ctrl.toggleMixingFromTags(target.parents('form').scope().tag)

        $el.on "click", ".mixing-confirm", (event) ->
            event.preventDefault()
            event.stopPropagation()
            $scope.$apply ->
                $ctrl.confirmMixingTags()

        $el.on "click", ".mixing-cancel", (event) ->
            event.preventDefault()
            event.stopPropagation()
            $scope.$apply ->
                $ctrl.cancelMixingTags()

        $el.on "click", ".edit-value", (event) ->
            event.preventDefault()
            target = angular.element(event.currentTarget)

            row = target.parents(".row.table-main")
            row.addClass("hidden")

            editionRow = row.siblings(".edition")
            editionRow.removeClass('hidden')
            editionRow.find('input:visible').first().focus().select()

        $el.on "keyup", ".new-value input", (event) ->
            if event.keyCode == 13
                target = $el.find(".new-value")
                saveNewValue(target)
            else if event.keyCode == 27
                $el.find(".new-value").addClass("hidden")
                initializeNewValue()

        $el.on "keyup", ".status-name input", (event) ->
            target = angular.element(event.currentTarget)
            if event.keyCode == 13
                saveValue(target)
            else if event.keyCode == 27
                cancel(target)

        $el.on "click", ".save", (event) ->
            event.preventDefault()
            target = angular.element(event.currentTarget)
            saveValue(target)

        $el.on "click", ".cancel", (event) ->
            event.preventDefault()
            target = angular.element(event.currentTarget)
            cancel(target)

        $el.on "click", ".delete-tag", (event) ->
            event.preventDefault()
            target = angular.element(event.currentTarget)
            formEl = target.parents("form")
            tag = formEl.scope().tag

            title = $translate.instant("ADMIN.COMMON.TITLE_ACTION_DELETE_TAG")

            $confirm.askOnDelete(title, tag.name).then (response) ->
                onSucces = ->
                    $ctrl.loadTags().finally ->
                        $rootscope.$broadcast('tags:updated')
                        response.finish()
                onError = ->
                    $confirm.notify("error")
                $ctrl.deleteTag(tag.name).then(onSucces, onError)

        $scope.$on "$destroy", ->
            $el.off()
            $window.off()

    return {link:link}

module.directive("tgProjectTags", ["$log", "$tgRepo", "$tgConfirm", "$tgLocation", "animationFrame","$translate", "$rootScope", ProjectTagsDirective])

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
