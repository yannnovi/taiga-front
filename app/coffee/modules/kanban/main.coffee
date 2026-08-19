###
# This source code is licensed under the terms of the
# GNU Affero General Public License found in the LICENSE file in
# the root directory of this source tree.
#
# Copyright (c) 2021-present Kaleidos INC
###

taiga = @.taiga

mixOf = @.taiga.mixOf
toggleText = @.taiga.toggleText
scopeDefer = @.taiga.scopeDefer
bindOnce = @.taiga.bindOnce
groupBy = @.taiga.groupBy
timeout = @.taiga.timeout
bindMethods = @.taiga.bindMethods
debounceLeading = @.taiga.debounceLeading

module = angular.module("taigaKanban")

#############################################################################
## Kanban Controller
#############################################################################

class KanbanController extends mixOf(taiga.Controller, taiga.PageMixin, taiga.FiltersMixin, taiga.UsFiltersMixin)
    excludeFilters: [
        "status"
    ]

    @.$inject = [
        "$scope",
        "$rootScope",
        "$tgRepo",
        "$tgConfirm",
        "$tgResources",
        "tgResources",
        "$routeParams",
        "$q",
        "$tgLocation",
        "tgAppMetaService",
        "$tgNavUrls",
        "$tgEvents",
        "$tgAnalytics",
        "$translate",
        "tgErrorHandlingService",
        "$tgModel",
        "tgKanbanUserstories",
        "$tgStorage",
        "tgFilterRemoteStorageService",
        "tgProjectService",
        "tgLightboxFactory",
        "tgLoader",
        "$timeout"
    ]

    storeCustomFiltersName: 'kanban-custom-filters'
    storeFiltersName: 'kanban-filters'
    validQueryParams: [
        'exclude_tags',
        'tags',
        'exclude_assigned_users',
        'assigned_users',
        'exclude_role',
        'role',
        'exclude_epic',
        'epic',
        'exclude_owner',
        'owner'
    ]

    constructor: (@scope, @rootscope, @repo, @confirm, @rs, @rs2, @params, @q, @location,
                  @appMetaService, @navUrls, @events, @analytics, @translate, @errorHandlingService,
                  @model, @kanbanUserstoriesService, @storage, @filterRemoteStorageService,
                  @projectService, @lightboxFactory, @tgLoader, @timeout) ->
        bindMethods(@)
        @kanbanUserstoriesService.reset()
        @.openFilter = false
        @.selectedUss = {}
        @.movedUs = []
        @.foldedSwimlane = Immutable.Map()
        @.isFirstLoad = true
        @.renderBatching = true
        @._cardLinkParamsCache = {}

        @.isLightboxOpened = false # True when a lighbox is open
        @.isRefreshNeeded = false  # True if a lighbox is open and some event arrived

        return if @.applyStoredFilters(@params.pslug, "kanban-filters", @.validQueryParams)

        @scope.sectionName = @translate.instant("KANBAN.SECTION_NAME")
        @.initializeEventHandlers()

        taiga.defineImmutableProperty @.scope, "usByStatus", () =>
            return @kanbanUserstoriesService.usByStatus

        taiga.defineImmutableProperty @.scope, "usMap", () =>
            return @kanbanUserstoriesService.usMap

        taiga.defineImmutableProperty @.scope, "usByStatusSwimlanes", () =>
            return @kanbanUserstoriesService.usByStatusSwimlanes

        taiga.defineImmutableProperty @.scope, "swimlanesList", () =>
            return @kanbanUserstoriesService.swimlanesList

    cleanSelectedUss: () ->
        for key of @.selectedUss
            @.selectedUss[key] = false

    toggleSelectedUs: (usId) ->
        @.selectedUss[usId] = !@.selectedUss[usId]

    firstLoad: () ->
        promise = @.loadInitialData()

        # On Success
        promise.then =>
            title = @translate.instant("KANBAN.PAGE_TITLE", {projectName: @scope.project.name})
            description = @translate.instant("KANBAN.PAGE_DESCRIPTION", {
                projectName: @scope.project.name,
                projectDescription: @scope.project.description
            })
            @appMetaService.setAll(title, description)

        # On Error
        promise.then null, @.onInitialDataError.bind(@)

    setZoom: (zoomLevel, zoom) ->
        zoomLevel = Number(zoomLevel)
        if @.zoomLevel == zoomLevel
            return null

        previousZoomLevel = @.zoomLevel

        @.zoomLevel = zoomLevel
        @.zoom = zoom

        if @.isFirstLoad
            @.firstLoad().then () =>
                @.isFirstLoad = false
                @kanbanUserstoriesService.resetFolds()

        else if @.zoomLevel > 2 && previousZoomLevel <= 2
            @.zoomLoading = true

            @.loadUserstories().then () =>
                @.zoomLoading = false
                @kanbanUserstoriesService.resetFolds()

    filtersReloadContent: debounceLeading 100, () ->
        @.loadUserstories().then (result) =>
            if !result
                return

            if @scope.swimlanesList.size && !result.length
                @.foldedSwimlane = @.foldedSwimlane.set(@scope.swimlanesList.first().id.toString(), false)

    moveToTopDropdown: (us) ->
        @.moveUsToTop(us.toJS().model)

    moveUsToTop: (uss) ->
        if !Array.isArray(uss)
            uss = [uss]

        us = uss[0]
        nextUsId = null
        userstories = []
        @.movedUs.push(us.id)
        @timeout () =>
            @.movedUs = []
        , 1000, false

        if us.swimlane
            userstories = @scope.usByStatusSwimlanes.getIn([
                us.swimlane,
                us.status
            ])
        else
            userstories = @scope.usByStatus.get(us.status.toString())

        if userstories && userstories.size
            nextUsId = userstories.get(0)

        if nextUsId
            @.moveUs(null, uss, us.status, us.swimlane, 0, null, nextUsId)

    initializeEventHandlers: ->
        @scope.$on "usform:new:success", (event, us, position = 'bottom') =>
            @.refreshTagsColors().then () =>
                @kanbanUserstoriesService.add(us)
                @scope.$broadcast("redraw:wip")

                if position == 'top'
                    @.moveUsToTop(us)

            @analytics.trackEvent("userstory", "create", "create userstory on kanban", 1)

        @scope.$on "usform:bulk:success", (event, uss, position = 'bottom') =>
            @confirm.notify("success")
            @.refreshTagsColors().then () =>
                @kanbanUserstoriesService.add(uss)
                @scope.$broadcast("redraw:wip")

                if position == 'top'
                    @.moveUsToTop(uss)

            @analytics.trackEvent("userstory", "create", "bulk create userstory on kanban", 1)

        @scope.$on "usform:edit:success", (event, us) =>
            @.refreshTagsColors().then () =>
                oldStatus = @kanbanUserstoriesService.getUsModel(us.id).status
                if oldStatus != us.status
                    # the us has to move at the end of the status
                    status = @scope.usByStatus.get(us.status.toString())
                    if status
                        lastUsId = status.last()
                        newOrder = @scope.usMap.get(lastUsId).getIn(['model', 'kanban_order']) + 1
                        us.kanban_order = newOrder

                @kanbanUserstoriesService.replaceModel(us)
                @kanbanUserstoriesService.refreshRawOrder()
                @kanbanUserstoriesService.refresh(false)

        @scope.$on "kanban:us:deleted", (event, us) =>
            @kanbanUserstoriesService.remove(us)

        @scope.$on("kanban:us:move", @.moveUs)
        @scope.$on("kanban:show-userstories-for-status", @.loadUserStoriesForStatus)
        @scope.$on("kanban:hide-userstories-for-status", @.hideUserStoriesForStatus)

        @scope.$on "lightbox:opened", () =>
            @.isLightboxOpened = true

        @scope.$on "lightbox:closed", () =>
            @.isLightboxOpened = false
            if @.isRefreshNeeded
                @.refreshAfterSwimlanesOrUserstoryStatusesHaveChanged()
                @.isRefreshNeeded = false

    refreshAfterSwimlanesOrUserstoryStatusesHaveChanged: ->
        # User story statuses has changed
        @tgLoader.start()
        @projectService.fetchProject().then () =>
            @.loadInitialData()

    initializeSubscription: ->
        randomTimeout = taiga.randomInt(700, 1000)

        # For user stories events
        routingKeyUserstories = "changes.project.#{@scope.projectId}.userstories"
        @events.subscribe @scope, routingKeyUserstories, debounceLeading randomTimeout, (message) =>
            @.eventsLoadUserstories(message)

        # For project attributes (swimlanes, statuses,...) events
        routingKeyProject = "changes.project.#{@scope.projectId}.projects"
        @events.subscribe @scope, routingKeyProject, debounceLeading randomTimeout, (message) =>
            if message.matches in [
                "projects.swimlane"
                "projects.swimlaneuserstorystatus"
                "projects.userstorystatus"
            ]
                if @.isLightboxOpened
                    @.isRefreshNeeded = true
                else
                    @.refreshAfterSwimlanesOrUserstoryStatusesHaveChanged()

    addNewUs: (type, statusId) ->
        swimlane = null
        switch type
            when "standard" then  @rootscope.$broadcast("genericform:new",
                {
                    'objType': 'us',
                    'project': @scope.project,
                    'statusId': statusId,
                    'swimlane': swimlane
                })
            when "bulk" then @rootscope.$broadcast("usform:bulk", @scope.projectId, statusId, swimlane)

    editUs: (id) ->
        us = @kanbanUserstoriesService.getUs(id)
        us = us.set('loading-edit', true)
        @kanbanUserstoriesService.replace(us)

        @rs.userstories.getByRef(us.getIn(['model', 'project']), us.getIn(['model', 'ref']))
        .then (editingUserStory) =>
            @rs2.attachments.list(
                "us", us.get('id'), us.getIn(['model', 'project'])).then (attachments) =>
                    @rootscope.$broadcast("genericform:edit", {
                        'objType': 'us',
                        'obj': editingUserStory,
                        'statusList': @scope.usStatusList,
                        'attachments': attachments.toJS()
                    })

                us = us.set('loading-edit', false)
                @kanbanUserstoriesService.replace(us)

    deleteUs: (id) ->
        us = @kanbanUserstoriesService.getUs(id)
        us = us.set('loading-delete', true)

        @rs.userstories.getByRef(us.getIn(['model', 'project']), us.getIn(['model', 'ref']))
        .then (deletingUserStory) =>
            us = us.set('loading-delete', false)
            title = @translate.instant("US.TITLE_DELETE_ACTION")
            message = deletingUserStory.subject
            @confirm.askOnDelete(title, message).then (askResponse) =>
                promise = @repo.remove(deletingUserStory)
                promise.then =>
                    model = us.toJS().model
                    @scope.$broadcast("kanban:us:deleted", model)
                    askResponse.finish()
                promise.then null, ->
                    askResponse.finish(false)
                    @confirm.notify("error")

    showPlaceHolder: (statusId, swimlaneId) ->
        firstStatus = @scope.usStatusList[0].id == statusId && !@kanbanUserstoriesService.userstoriesRaw.length

        if swimlaneId
            firstSwimlane =  @scope.swimlanesList.first().id == swimlaneId
            return firstStatus && firstSwimlane

        return firstStatus

    toggleFold: (id) ->
        @kanbanUserstoriesService.toggleFold(id)

    toggleSwimlane: (id) ->
        @.foldedSwimlane = @.foldedSwimlane.set(id.toString(), !@.foldedSwimlane.get(id.toString()))
        @rs.kanban.storeSwimlanesModes(@scope.projectId, @.foldedSwimlane.toJS())

        @timeout () =>
            @scope.$broadcast("redraw:wip")
        , 100, false

    isUsInArchivedHiddenStatus: (usId) ->
        return @kanbanUserstoriesService.isUsInArchivedHiddenStatus(usId)

    changeUsAssignedUsers: (id) =>
        item = @kanbanUserstoriesService.getUsModel(id)

        onClose = (assignedUsersIds) =>
            item.assigned_users = assignedUsersIds
            if item.assigned_to not in assignedUsersIds and assignedUsersIds.length > 0
                item.assigned_to = assignedUsersIds[0]
            if assignedUsersIds.length == 0
                item.assigned_to = null
            @kanbanUserstoriesService.replaceModel(item)

            @repo.save(item).then =>
                @.generateFilters()
                if @.isFilterDataTypeSelected('assigned_users') || @.isFilterDataTypeSelected('role')
                    @.filtersReloadContent()

        @lightboxFactory.create(
            'tg-lb-select-user',
            {
                "class": "lightbox lightbox-select-user",
            },
            {
                "currentUsers": _.compact(_.union(item.assigned_users, [item.assigned_to])),
                "activeUsers": @scope.activeUsers,
                "onClose": onClose,
                "lbTitle": @translate.instant("COMMON.ASSIGNED_USERS.ADD"),
            }
        )

    refreshTagsColors: ->
        return @rs.projects.tagsColors(@scope.projectId).then (tags_colors) =>
            @scope.project.tags_colors = tags_colors._attrs

    renderBatch: (clean = false) ->
        @.renderInProgress = true
        newUs = _.take(@.queue, @.batchSize)
        @.rendered = _.concat(@.rendered, newUs)
        @.queue = _.drop(@.queue, @.batchSize)

        if clean
            @kanbanUserstoriesService.set(newUs)
            @.batchTimings = [200, 100, 50]
        else
            @kanbanUserstoriesService.add(newUs)

        if @.queue.length > 0
            timeout = @.batchTimings.shift() || 20
            @timeout(@.renderBatch, timeout)
        else
            scopeDefer @scope, =>
                # The broadcast must be executed when the DOM has been fully reloaded.
                # We can't assure when this exactly happens so we need a defer
                @rootscope.$broadcast("kanban:userstories:loaded", @.rendered)
                @scope.$broadcast("userstories:loaded", @.rendered)
                @.renderInProgress = false

                @timeout () =>
                    @scope.$broadcast("redraw:wip")
                , 100, false

    renderUserStories: (userstories) =>
        userstories = _.sortBy(userstories, 'kanban_order')
        # init before render is needed in KanbanSquishColumnDirective to
        # render status columns if not we will see the column squash on load
        @kanbanUserstoriesService.initUsByStatusList(userstories)

        if @.renderBatching
            userstoriesMap = _.groupBy(userstories, 'status')
            @.rendered = []
            @.queue = []
            @.batchSize = 0

            while (@.queue.length < userstories.length)
                _.each @scope.project.us_statuses, (x) =>
                    if (userstoriesMap[x.id]?.length > 0)
                        @.queue = _.concat(@.queue, _.take(userstoriesMap[x.id], 10))
                        userstoriesMap[x.id] = _.drop(userstoriesMap[x.id], 10)
                if !@.batchSize
                    @.batchSize = 100

            @.renderBatch(true)
        else
            @kanbanUserstoriesService.set(userstories)

    loadUserstoriesParams: () ->
        params = {
            status__is_archived: false
        }

        if @.zoomLevel >= 2
            params.include_attachments = 1
            params.include_tasks = 1

        locationParams = _.pick(_.clone(@location.search()), @.validQueryParams)
        params = _.merge params, locationParams
        params.q = @.filterQ

        return params

    eventsLoadUserstories: (data) ->
        eventUserstories = []

        if !Array.isArray(data.pk)
            eventUserstories = [data.pk]
        else
            eventUserstories = data.pk

        modifiedUs = eventUserstories.filter (us) => !!@kanbanUserstoriesService.userstoriesRaw.find((raw) => raw.id == us)

        params = @.loadUserstoriesParams()

        @rs.userstories.listAll(@scope.projectId, params).then (userstories) =>
            newUss = userstories.filter (us) => !@kanbanUserstoriesService.userstoriesRaw.find((raw) => raw.id == us.id)

            userstories
            .filter((us) => modifiedUs.includes(us.id))
            .forEach (us) =>
                @kanbanUserstoriesService.replaceModel(us)
                @kanbanUserstoriesService.refreshRawOrder()

            if newUss.length
                @kanbanUserstoriesService.add(newUss)

            @kanbanUserstoriesService.refresh(false)

    # Used by the Angular `tg-card` component (bind-link-params) to preserve the current
    # swimlane/filter context when navigating to a US detail and back - previously computed
    # inside CardController.getLinkParams() by walking UP the AngularJS scope chain
    # (taiga.findScope) to reach this same controller; now computed here directly and
    # passed down as a plain input, since a real Angular component has no scope chain to
    # walk. Taskboard's card caller has no equivalent (its controller never had
    # lastLoadUserstoriesParams either) and simply doesn't pass link-params at all.
    # `bind-link-params` on `tg-card` re-evaluates this on every AngularJS digest - unlike
    # the original `CardController.getLinkParams()`, which was only ever read through a
    # `{{ }}` string interpolation (`tg-nav-get-params="{{ vm.getLinkParams() }}"`),
    # implicitly stringified into a stable, reference-independent value. Bound directly as
    # an object here, a freshly-built object on every call (even with identical content)
    # never compares equal by reference, which sent the digest into
    # `[$rootScope:infdig] 10 $digest() iterations reached`. Cached per item id (in
    # `@._cardLinkParamsCache`, initialized in the constructor below), returning the same
    # reference whenever the computed content hasn't actually changed.
    getCardLinkParams: (item) ->
        if not @.lastLoadUserstoriesParams
            return {}

        params = _.clone(@.lastLoadUserstoriesParams)
        params['status'] = item.getIn(['model', 'status'])
        params['swimlane'] = item.getIn(['model', 'swimlane'])

        params = _.pickBy(params, _.identity)

        if @scope.swimlanesList.size && !params['swimlane']
            params.swimlane = "null"

        parsedParams = {}
        Object.keys(params).forEach (key) =>
            parsedParams['kanban-' + key] = params[key]

        itemId = item.get('id')
        cached = @._cardLinkParamsCache[itemId]

        if cached && _.isEqual(cached, parsedParams)
            return cached

        @._cardLinkParamsCache[itemId] = parsedParams

        return parsedParams

    loadUserstories: () ->
        params = @.loadUserstoriesParams()

        @.lastSearch = @.filterQ
        lastSearch = @.filterQ
        @.lastLoadUserstoriesParams = params

        loadPromises = [
            @rs.userstories.listAll(@scope.projectId, params),
            @.loadSwimlanes()
        ]

        archivedPromises = []
        openArchived = _.difference(@kanbanUserstoriesService.archivedStatus,
                                    @kanbanUserstoriesService.statusHide)

        if openArchived.length
            archivedPromises = openArchived.map (archivedStatusId) =>
                return @.loadUserStoriesForStatus({}, archivedStatusId)

        loadPromises = loadPromises.concat(archivedPromises)

        promise = @q.all(loadPromises).then (result) =>
            if lastSearch != @.lastSearch
                return

            @kanbanUserstoriesService.reset(false, false, false)
            userstories = result[0]
            swimlanes = result[1]

            if result.length > 2
                result.slice(2).forEach (archivedRedult) =>
                    userstories = userstories.concat(archivedRedult)

            @.notFoundUserstories = false

            if !userstories.length && ((@.filterQ && @.filterQ.length) || Object.keys(@location.search()).length)
                @.notFoundUserstories = true

            @kanbanUserstoriesService.init(@scope.project, swimlanes, @scope.usersById)
            @tgLoader.pageLoaded()
            @.renderUserStories(userstories)

            return userstories

        return promise

    loadUserStoriesForStatus: (ctx, statusId) ->
        filteredStatus = @location.search().status

        # if there are filters applied the action doesn't end if the statusId is not in the url
        if filteredStatus
            filteredStatus = filteredStatus.split(",").map (it) -> parseInt(it, 10)

            return if filteredStatus.indexOf(statusId) == -1

        params = {
            status: statusId
            include_attachments: true,
            include_tasks: true
        }

        if @.filterQ
            params.q = @.filterQ

        params = _.merge params, @location.search()

        return @rs.userstories.listAll(@scope.projectId, params).then (userstories) =>
            @.waitEmptyQuote () =>
                @scope.$broadcast("kanban:shown-userstories-for-status", statusId, userstories)

            return userstories

    waitEmptyQuote: (cb) ->
        if @.queue.length > 0
            requestAnimationFrame () => @.waitEmptyQuote(cb)
        else
            scopeDefer @scope, => cb()

    hideUserStoriesForStatus: (ctx, statusId) ->
        @scope.$broadcast("kanban:hidden-userstories-for-status", statusId)

    loadKanban: ->
        return @q.all([
            @.refreshTagsColors(),
            @.loadUserstories()
        ])

    loadSwimlanes: ->
        return @rs.swimlanes.list(@scope.projectId).then (swimlanes) =>
            @scope.swimlanes = swimlanes
            @scope.swimlanesStatuses = {}

            @scope.swimlanes.forEach (swimlane) =>
                @scope.swimlanesStatuses[swimlane.id] = swimlane.statuses

            @scope.swimlanesStatuses[-1] = @scope.project.us_statuses

            return @scope.swimlanes

    loadProject: ->
        project = @projectService.project.toJS()

        if not project.is_kanban_activated
            @errorHandlingService.permissionDenied()

        @scope.projectId = project.id
        @scope.project = project
        @scope.projectId = project.id
        @scope.points = _.sortBy(project.points, "order")
        @scope.pointsById = groupBy(project.points, (x) -> x.id)
        @scope.usStatusById = groupBy(project.us_statuses, (x) -> x.id)
        @scope.usStatusList = _.sortBy(project.us_statuses, "order")
        @scope.usCardVisibility = {}

        @scope.$emit("project:loaded", project)
        return project

    loadInitialData: ->
        project = @.loadProject()
        @.foldedSwimlane = Immutable.fromJS(@rs.kanban.getSwimlanesModes(project.id))
        @.initialLoad = false

        @.fillUsersAndRoles(project.members, project.roles)
        @.initializeSubscription()
        @.loadKanban().then () =>
            @timeout () =>
                @.initialLoad = true
            , 0, true

        @.generateFilters()

    moveUs: (ctx, usList, newStatusId, newSwimlaneId, index, previousCard, nextCard) ->
        @.cleanSelectedUss()

        usList = _.map usList, (us) =>
            return @kanbanUserstoriesService.getUsModel(us.id)

        @rootscope.$broadcast("kanban:userstories:loaded", usList, newStatusId, newSwimlaneId, index)

        apiNewSwimlaneId = newSwimlaneId

        if newSwimlaneId == -1
            apiNewSwimlaneId = null

        data = @kanbanUserstoriesService.move(
            usList.map((it) => it.id),
            newStatusId,
            apiNewSwimlaneId,
            index,
            previousCard,
            nextCard
        )

        promise = @rs.userstories.bulkUpdateKanbanOrder(
            @scope.projectId,
            newStatusId,
            apiNewSwimlaneId,
            data.afterUserstoryId,
            data.beforeUserstoryId,
            data.bulkUserstories
        )

        promise.then () =>
            @scope.$broadcast("redraw:wip")

            @.generateFilters()
            if @.isFilterDataTypeSelected('status')
                @.filtersReloadContent()

module.controller("KanbanController", KanbanController)
