###
# This source code is licensed under the terms of the
# GNU Affero General Public License found in the LICENSE file in
# the root directory of this source tree.
#
# Copyright (c) 2021-present Kaleidos INC
###

# Characterization specs for BacklogController (Phase 3 safety net, see MIGRATION_ROADMAP.md).
#
# These pin down the controller's *current* behaviour - including a few oddities, flagged
# inline with "NOTE (current behaviour)" - so that refactoring the ambient-scope directives
# that depend on it (tgSprint, tg-backlog-sprint-header, ...) can be done without silently
# changing what the backlog page does. Don't "fix" an expectation here without deciding
# the behaviour change on purpose.

describe "BacklogController", ->
    $controller = null
    $q = null
    $rootScope = null
    scope = null
    mocks = null

    headerFn = (headers = {}) ->
        return (name) -> headers[name]

    buildProject = (overrides = {}) ->
        return _.assign({
            id: 1
            slug: "project-slug"
            name: "Project name"
            description: "Project description"
            is_backlog_activated: true
            total_closed_milestones: 2
            default_us_status: 10
            points: [{id: 2, order: 2}, {id: 1, order: 1}]
            us_statuses: [{id: 11, name: "b"}, {id: 10, name: "a"}]
            members: [
                {id: 1, full_name_display: "Zed", is_active: true, role: 100}
                {id: 2, full_name_display: "Amy", is_active: false, role: 101}
            ]
            roles: [
                {id: 101, order: 2, computable: true}
                {id: 100, order: 1, computable: true}
                {id: 102, order: 3, computable: true}
            ]
            swimlanes: []
            my_permissions: []
        }, overrides)

    buildStats = (overrides = {}) ->
        return _.assign({
            total_points: 100
            defined_points: 80
            closed_points: 25
            assigned_points: 0
            total_milestones: 3
            speed: 0
        }, overrides)

    buildMocks = (opts = {}) ->
        m = {}

        m.repo = {remove: sinon.stub()}
        m.confirm = {
            notify: sinon.stub()
            askOnDelete: sinon.stub()
        }
        m.rs = {
            userstories: {
                getShowTags: sinon.stub().returns(true)
                storeShowTags: sinon.stub()
                storeQueryParams: sinon.stub()
                storeBacklog: sinon.stub()
                listUnassigned: sinon.stub().returns($q.when([[], headerFn()]))
                filtersData: sinon.stub().returns($q.when({}))
                bulkUpdateBacklogOrder: sinon.stub()
                getByRef: sinon.stub()
            }
            sprints: {
                list: sinon.stub().returns($q.when({milestones: [], open: 0, closed: 0}))
            }
            projects: {
                stats: sinon.stub().returns($q.when(buildStats()))
            }
        }
        m.params = {pslug: "project-slug"}
        m.searchParams = opts.searchParams or {}
        m.location = {
            search: sinon.spy (name, value) ->
                return m.searchParams if arguments.length == 0
                return m.location
            replace: sinon.stub()
            noreload: sinon.spy -> m.location
            isInCurrentRouteParams: sinon.stub().returns(false)
        }
        m.appMetaService = {setAll: sinon.stub()}
        m.navUrls = {resolve: sinon.stub()}
        m.events = {subscribe: sinon.stub(), connected: true}
        m.analytics = {trackEvent: sinon.stub()}
        m.translate = {instant: sinon.spy (key) -> key}
        m.loading = {}
        m.rs2 = {attachments: {list: sinon.stub()}}
        m.modelTransform = {}
        m.errorHandlingService = {
            permissionDenied: sinon.stub()
            notfound: sinon.stub()
        }
        m.storage = {
            get: sinon.stub().returns(opts.storedFilters or null)
            set: sinon.stub()
        }
        m.filterRemoteStorageService = {
            getFilters: sinon.stub().returns($q.when({}))
            storeFilters: sinon.stub().returns($q.when())
        }
        m.projectService = {project: Immutable.fromJS(opts.project or buildProject())}
        m.tgLoader = {pageLoaded: sinon.stub()}

        return m

    createController = (opts = {}) ->
        mocks = buildMocks(opts)
        opts.beforeCreate?(mocks)

        ctrl = $controller("BacklogController", {
            $scope: scope
            $rootScope: $rootScope
            $tgRepo: mocks.repo
            $tgConfirm: mocks.confirm
            $tgResources: mocks.rs
            $routeParams: mocks.params
            $q: $q
            $tgLocation: mocks.location
            tgAppMetaService: mocks.appMetaService
            $tgNavUrls: mocks.navUrls
            $tgEvents: mocks.events
            $tgAnalytics: mocks.analytics
            $translate: mocks.translate
            $tgLoading: mocks.loading
            tgResources: mocks.rs2
            $tgQueueModelTransformation: mocks.modelTransform
            tgErrorHandlingService: mocks.errorHandlingService
            $tgStorage: mocks.storage
            tgFilterRemoteStorageService: mocks.filterRemoteStorageService
            tgProjectService: mocks.projectService
            tgLoader: mocks.tgLoader
        })

        $rootScope.$digest()

        return ctrl

    beforeEach ->
        module "taigaBacklog"

        inject (_$controller_, _$q_, _$rootScope_) ->
            $controller = _$controller_
            $q = _$q_
            $rootScope = _$rootScope_

        scope = $rootScope.$new()

    ##########################################################################
    ## Initialization
    ##########################################################################

    describe "initialization", ->
        it "loads the project into the scope", ->
            createController()

            expect(scope.projectId).to.be.equal(1)
            expect(scope.project.slug).to.be.equal("project-slug")
            expect(scope.closedMilestones).to.be.true
            expect(_.map(scope.points, "id")).to.be.eql([1, 2])
            expect(scope.pointsById[2].order).to.be.equal(2)
            expect(_.map(scope.usStatusList, "id")).to.be.eql([10, 11])
            expect(scope.usStatusById[11].name).to.be.equal("b")

        it "fills users and roles from the project members", ->
            createController()

            expect(_.map(scope.activeUsers, "id")).to.be.eql([1])
            expect(_.map(scope.users, "id")).to.be.eql([2, 1])
            expect(scope.usersById[2].full_name_display).to.be.equal("Amy")
            expect(_.map(scope.roles, "id")).to.be.eql([100, 101, 102])
            # only roles actually held by a member are computable
            expect(_.map(scope.computableRoles, "id")).to.be.eql([101, 100])

        it "loads stats, open sprints and the first page of unassigned user stories", ->
            createController()

            expect(mocks.rs.projects.stats).to.have.been.calledWith(1)
            expect(mocks.rs.sprints.list).to.have.been.calledWith(1, {closed: false})
            expect(mocks.rs.userstories.listUnassigned).to.have.been.calledWith(1, sinon.match({page: 1}))

        it "subscribes to user story and milestone change events", ->
            createController()

            routingKeys = _.map(mocks.events.subscribe.args, (args) -> args[1])

            expect(routingKeys).to.be.eql([
                "changes.project.1.userstories",
                "changes.project.1.milestones"
            ])
            expect(mocks.events.subscribe.args[1][3]).to.be.eql({selfNotification: true})

        it "sets the page metadata and marks the first load complete", ->
            ctrl = createController()

            expect(ctrl.firstLoadComplete).to.be.true
            expect(mocks.appMetaService.setAll).to.have.been.calledWith(
                "BACKLOG.PAGE_TITLE",
                "BACKLOG.PAGE_DESCRIPTION"
            )
            expect(mocks.translate.instant).to.have.been.calledWith(
                "BACKLOG.PAGE_TITLE", {projectName: "Project name"})

        it "emits backlog:loaded once the initial data is loaded", ->
            loaded = sinon.stub()
            $rootScope.$on("backlog:loaded", loaded)

            createController()

            expect(loaded).to.have.been.calledOnce

        it "denies access when the backlog module is disabled", ->
            createController({project: buildProject({is_backlog_activated: false})})

            expect(mocks.errorHandlingService.permissionDenied).to.have.been.called

        it "hides tags when the stored preference is false", ->
            ctrl = createController({
                beforeCreate: (m) -> m.rs.userstories.getShowTags.returns(false)
            })

            expect(ctrl.showTags).to.be.false

        it "redirects to the stored filters instead of loading when the url has none", ->
            ctrl = createController({
                storedFilters: {status: "1,2", q: "dropped", not_valid: "x"}
            })

            expect(mocks.location.search).to.have.been.calledWith({status: "1,2"})
            expect(mocks.location.replace).to.have.been.called
            expect(mocks.rs.userstories.listUnassigned).not.to.have.been.called
            expect(ctrl.firstLoadComplete).to.be.false

        it "ignores stored filters when the url already has some", ->
            createController({
                searchParams: {tags: "a"}
                storedFilters: {status: "1,2"}
            })

            expect(mocks.location.replace).not.to.have.been.called
            expect(mocks.rs.userstories.listUnassigned).to.have.been.called

        it "passes only valid query params to the user story request and stores them", ->
            createController({searchParams: {status: "1", foo: "bar", exclude_tags: "x"}})

            # the same object is mutated with page/q right after (harmless for $tgStorage,
            # which serializes immediately), so check fields instead of deep equality
            [projectId, stored] = mocks.rs.userstories.storeQueryParams.args[0]
            expect(projectId).to.be.equal(1)
            expect(stored.status).to.be.equal("1")
            expect(stored.exclude_tags).to.be.equal("x")
            expect(stored).not.to.have.property("foo")

    ##########################################################################
    ## Sprints
    ##########################################################################

    describe "loadSprints", ->
        sprints = null

        beforeEach ->
            sprints = [
                {
                    id: 5, name: "s1", closed: false,
                    estimated_start: "2000-01-01", estimated_finish: "2000-01-15",
                    user_stories: [{id: 51, sprint_order: 2}, {id: 50, sprint_order: 1}]
                }
                {
                    id: 6, name: "s2", closed: false,
                    estimated_start: moment().subtract(1, "days").format("YYYY-MM-DD"),
                    estimated_finish: moment().add(1, "days").format("YYYY-MM-DD"),
                    user_stories: []
                }
            ]

        it "exposes sprints on the scope with user stories sorted by sprint_order", ->
            ctrl = createController()
            mocks.rs.sprints.list.returns($q.when({milestones: sprints, open: 2, closed: 4}))

            ctrl.loadSprints()
            $rootScope.$digest()

            expect(scope.sprints).to.be.equal(sprints)
            expect(_.map(scope.sprints[0].user_stories, "id")).to.be.eql([50, 51])
            expect(scope.sprintsById[6].name).to.be.equal("s2")
            expect(scope.sprintsCounter).to.be.equal(2)
            expect(scope.totalOpenMilestones).to.be.equal(2)
            expect(scope.totalClosedMilestones).to.be.equal(4)
            expect(scope.totalMilestones).to.be.equal(6)
            expect(ctrl.milestonesOrder[5]).to.be.eql({50: 1, 51: 2})

        it "detects the current sprint from the estimated dates", ->
            ctrl = createController()
            mocks.rs.sprints.list.returns($q.when({milestones: sprints, open: 2, closed: 0}))

            ctrl.loadSprints()
            $rootScope.$digest()

            expect(scope.currentSprint.id).to.be.equal(6)

        it "broadcasts sprints:loaded with the sprints", ->
            ctrl = createController()
            mocks.rs.sprints.list.returns($q.when({milestones: sprints, open: 2, closed: 0}))
            listener = sinon.stub()
            scope.$on("sprints:loaded", listener)

            ctrl.loadSprints()
            $rootScope.$digest()

            expect(listener).to.have.been.calledOnce
            expect(listener.args[0][1]).to.be.equal(sprints)

        it "initializes closedSprints only if not already loaded", ->
            ctrl = createController()
            expect(scope.closedSprints).to.be.eql([])

            scope.closedSprints = [{id: 99}]
            ctrl.loadSprints()
            $rootScope.$digest()

            expect(scope.closedSprints).to.be.eql([{id: 99}])

    describe "loadClosedSprints", ->
        it "loads closed sprints, indexes them and broadcasts closed-sprints:reloaded", ->
            ctrl = createController()
            closed = [{id: 7, closed: true, user_stories: [{id: 71, sprint_order: 3}, {id: 70, sprint_order: 0}]}]
            mocks.rs.sprints.list.withArgs(1, {closed: true}).returns($q.when({milestones: closed, closed: 1}))
            listener = sinon.stub()
            scope.$on("closed-sprints:reloaded", listener)

            ctrl.loadClosedSprints()
            $rootScope.$digest()

            expect(scope.closedSprints).to.be.equal(closed)
            expect(scope.closedSprintsById[7]).to.be.equal(closed[0])
            expect(_.map(closed[0].user_stories, "id")).to.be.eql([70, 71])
            expect(scope.totalClosedMilestones).to.be.equal(1)
            expect(ctrl.milestonesOrder[7]).to.be.eql({70: 0, 71: 3})
            expect(listener.args[0][1]).to.be.equal(closed)

        it "is triggered by backlog:load-closed-sprints", ->
            ctrl = createController()
            mocks.rs.sprints.list.reset()
            mocks.rs.sprints.list.returns($q.when({milestones: [], closed: 0}))

            scope.$broadcast("backlog:load-closed-sprints")

            expect(mocks.rs.sprints.list).to.have.been.calledWith(1, {closed: true})

    describe "unloadClosedSprints", ->
        it "clears closed sprints and broadcasts an empty reload", ->
            ctrl = createController()
            scope.closedSprints = [{id: 7}]
            listener = sinon.stub()
            scope.$on("closed-sprints:reloaded", listener)

            ctrl.unloadClosedSprints()

            expect(scope.closedSprints).to.be.eql([])
            expect(listener.args[0][1]).to.be.eql([])

    describe "sprintTotalPoints", ->
        it "sums only the user stories still assigned to that sprint", ->
            ctrl = createController()

            total = ctrl.sprintTotalPoints({
                id: 5
                user_stories: [
                    {milestone: 5, total_points: 3}
                    {milestone: 5, total_points: 2}
                    {milestone: 6, total_points: 100}
                ]
            })

            expect(total).to.be.equal(5)

    ##########################################################################
    ## Stats & forecasting
    ##########################################################################

    describe "loadProjectStats", ->
        it "computes the completed percentage from total points", ->
            ctrl = createController()
            mocks.rs.projects.stats.returns($q.when(buildStats({total_points: 40, closed_points: 10})))

            ctrl.loadProjectStats()
            $rootScope.$digest()

            expect(scope.stats.completedPercentage).to.be.equal(25)
            expect(scope.showGraphPlaceholder).to.be.false

        it "falls back to defined points when there are no total points", ->
            ctrl = createController()
            mocks.rs.projects.stats.returns($q.when(buildStats({
                total_points: null, defined_points: 50, closed_points: 10
            })))

            ctrl.loadProjectStats()
            $rootScope.$digest()

            expect(scope.stats.completedPercentage).to.be.equal(20)
            expect(scope.showGraphPlaceholder).to.be.true

        it "is 0% when there are no points at all", ->
            ctrl = createController()
            mocks.rs.projects.stats.returns($q.when(buildStats({
                total_points: 0, defined_points: 0, closed_points: 0
            })))

            ctrl.loadProjectStats()
            $rootScope.$digest()

            expect(scope.stats.completedPercentage).to.be.equal(0)

    describe "calculateForecasting", ->
        it "forecasts user stories until the velocity is exceeded", ->
            ctrl = createController()
            scope.stats = buildStats({speed: 5})
            scope.sprints = []
            scope.userstories = [
                {ref: 1, total_points: 2}
                {ref: 2, total_points: 2}
                {ref: 3, total_points: 2}
                {ref: 4, total_points: 2}
            ]

            ctrl.calculateForecasting()

            # the user story that crosses the velocity is included, then it stops
            expect(_.map(ctrl.forecastedStories, "ref")).to.be.eql([1, 2, 3])
            expect(scope.forecastNewSprint).to.be.true

        it "fills the first open sprint before forecasting a new one", ->
            ctrl = createController()
            scope.stats = buildStats({speed: 5})
            scope.sprints = [{id: 5, user_stories: [{milestone: 5, total_points: 4}]}]
            scope.userstories = [
                {ref: 1, total_points: 2}
                {ref: 2, total_points: 2}
            ]

            ctrl.calculateForecasting()

            expect(_.map(ctrl.forecastedStories, "ref")).to.be.eql([1])
            expect(scope.forecastNewSprint).to.be.false

        it "forecasts a new sprint when the first one is already over the velocity", ->
            ctrl = createController()
            scope.stats = buildStats({speed: 5})
            scope.sprints = [{id: 5, user_stories: [{milestone: 5, total_points: 9}]}]
            scope.userstories = [{ref: 1, total_points: 2}, {ref: 2, total_points: 2}]

            ctrl.calculateForecasting()

            expect(_.map(ctrl.forecastedStories, "ref")).to.be.eql([1, 2])
            expect(scope.forecastNewSprint).to.be.true

        it "forecasts every user story when there is no velocity", ->
            ctrl = createController()
            scope.stats = buildStats({speed: 0})
            scope.sprints = []
            scope.userstories = [{ref: 1, total_points: 20}, {ref: 2, total_points: 20}]

            ctrl.calculateForecasting()

            expect(_.map(ctrl.forecastedStories, "ref")).to.be.eql([1, 2])

    describe "toggleVelocityForecasting", ->
        it "restricts visible user stories to the forecasted ones, then restores them", ->
            ctrl = createController()
            scope.stats = buildStats({speed: 1})
            scope.sprints = []
            scope.userstories = [{ref: 1, total_points: 2}, {ref: 2, total_points: 2}]

            ctrl.toggleVelocityForecasting()
            expect(ctrl.displayVelocity).to.be.true
            expect(scope.visibleUserStories).to.be.eql([1])

            ctrl.toggleVelocityForecasting()
            expect(ctrl.displayVelocity).to.be.false
            expect(scope.visibleUserStories).to.be.eql([1, 2])

    ##########################################################################
    ## User stories loading
    ##########################################################################

    describe "loadUserstories", ->
        it "returns null without a project", ->
            ctrl = createController()
            scope.projectId = null

            expect(ctrl.loadUserstories()).to.be.null

        it "sorts user stories by backlog_order and exposes their refs", ->
            ctrl = createController()
            mocks.rs.userstories.listUnassigned.returns($q.when([
                [{id: 2, ref: 20, backlog_order: 2}, {id: 1, ref: 10, backlog_order: 1}],
                headerFn()
            ]))

            ctrl.loadUserstories(true)
            $rootScope.$digest()

            expect(_.map(scope.userstories, "id")).to.be.eql([1, 2])
            expect(scope.visibleUserStories).to.be.eql([10, 20])
            expect(scope.first_us_in_backlog).to.be.equal(1)
            expect(ctrl.backlogOrder).to.be.eql({1: 1, 2: 2})

        it "appends pages and advances the page while there is a next page", ->
            ctrl = createController()
            pages = [
                [[{id: 1, ref: 10, backlog_order: 1}], headerFn({"x-pagination-next": "next"})]
                [[{id: 2, ref: 20, backlog_order: 0}], headerFn()]
            ]
            # preloadUsIds() also calls listUnassigned (with only_ref) - keep those out of
            # the page sequence
            mocks.rs.userstories.listUnassigned = sinon.spy (projectId, params) ->
                return $q.when([[], headerFn()]) if params.only_ref
                return $q.when(pages.shift())

            ctrl.loadUserstories(true)
            $rootScope.$digest()
            expect(ctrl.page).to.be.equal(2)
            expect(ctrl.disablePagination).to.be.false

            ctrl.loadUserstories()
            $rootScope.$digest()

            # NOTE (current behaviour): pages are concatenated, each page sorted on its
            # own - not re-sorted as a whole.
            expect(_.map(scope.userstories, "id")).to.be.eql([1, 2])
            expect(ctrl.page).to.be.equal(2)
            expect(ctrl.disablePagination).to.be.true

        it "resets the list and pagination on resetPagination", ->
            ctrl = createController()
            scope.userstories = [{id: 99, ref: 99}]
            ctrl.page = 4
            mocks.rs.userstories.listUnassigned.returns($q.when([
                [{id: 1, ref: 10, backlog_order: 1}], headerFn()
            ]))

            ctrl.loadUserstories(true)

            expect(mocks.rs.userstories.listUnassigned.lastCall.args[1].page).to.be.equal(1)
            $rootScope.$digest()
            expect(_.map(scope.userstories, "id")).to.be.eql([1])

        it "reads totals from the response headers", ->
            ctrl = createController()
            mocks.rs.userstories.listUnassigned.returns($q.when([[], headerFn({
                "Taiga-Info-Backlog-Total-Userstories": "42"
                "Taiga-Info-Userstories-Without-Swimlane": "3"
            })]))

            ctrl.loadUserstories(true)
            $rootScope.$digest()

            expect(ctrl.totalUserStories).to.be.equal("42")
            expect(scope.noSwimlaneUserStories).to.be.equal("3")

        it "flags newly created user stories", ->
            ctrl = createController()
            ctrl.newUs = [2]
            mocks.rs.userstories.listUnassigned.returns($q.when([
                [{id: 1, ref: 10, backlog_order: 1}, {id: 2, ref: 20, backlog_order: 2}], headerFn()
            ]))

            ctrl.loadUserstories(true)
            $rootScope.$digest()

            expect(scope.userstories[0].new).to.be.undefined
            expect(scope.userstories[1].new).to.be.true

        it "sends the search text and broadcasts backlog:userstories:loaded", ->
            ctrl = createController()
            ctrl.filterQ = "needle"
            listener = sinon.stub()
            $rootScope.$on("backlog:userstories:loaded", listener)

            ctrl.loadUserstories(true)
            $rootScope.$digest()

            expect(mocks.rs.userstories.listUnassigned.lastCall.args[1].q).to.be.equal("needle")
            expect(ctrl.translationData.q).to.be.equal("needle")
            expect(listener).to.have.been.calledOnce

    describe "getLinkParams", ->
        it "is empty before any user story load", ->
            ctrl = createController()
            ctrl.lastLoadUserstoriesParams = null
            ctrl._linkParamsCache = null

            expect(ctrl.getLinkParams()).to.be.eql({})

        it "prefixes the last load params, drops page and empty values, adds no-milestone", ->
            ctrl = createController()
            ctrl.lastLoadUserstoriesParams = {page: 3, status: "1", q: "", tags: "a"}

            expect(ctrl.getLinkParams()).to.be.eql({
                "backlog-status": "1"
                "backlog-tags": "a"
                "no-milestone": 1
            })

        it "returns the same reference while the content is unchanged (avoids infdig)", ->
            ctrl = createController()
            ctrl.lastLoadUserstoriesParams = {status: "1"}

            first = ctrl.getLinkParams()
            ctrl.lastLoadUserstoriesParams = {status: "1"}

            expect(ctrl.getLinkParams()).to.be.equal(first)

            ctrl.lastLoadUserstoriesParams = {status: "2"}
            expect(ctrl.getLinkParams()).not.to.be.equal(first)

    ##########################################################################
    ## Moving user stories (drag & drop, "move to top", ...)
    ##########################################################################

    describe "moveUs", ->
        ctrl = null
        bulkUpdate = null
        us1 = us2 = us3 = null
        sprint = null

        beforeEach ->
            ctrl = createController()

            us1 = {id: 1, ref: 10, project: 1, milestone: null, backlog_order: 1}
            us2 = {id: 2, ref: 20, project: 1, milestone: null, backlog_order: 2}
            us3 = {id: 3, ref: 30, project: 1, milestone: null, backlog_order: 3}
            scope.userstories = [us1, us2, us3]

            sprint = {id: 5, user_stories: [{id: 50, milestone: 5, project: 1}]}
            scope.sprints = [sprint]
            scope.sprintsById = {5: sprint}
            scope.closedSprintsById = {}

            bulkUpdate = $q.defer()
            mocks.rs.userstories.bulkUpdateBacklogOrder.returns(bulkUpdate.promise)

        it "moves a user story from the backlog into a sprint", ->
            ctrl.moveUs("sprint:us:move", [us2], 0, 5, null, 50)

            expect(_.map(scope.userstories, "id")).to.be.eql([1, 3])
            expect(scope.visibleUserStories).to.be.eql([10, 30])
            expect(_.map(scope.sprintsById[5].user_stories, "id")).to.be.eql([2, 50])
            expect(us2.milestone).to.be.equal(5)
            expect(mocks.rs.userstories.bulkUpdateBacklogOrder).to.have.been.calledWith(1, 5, null, 50, [2])

        it "moves a user story from a sprint back to the backlog", ->
            sprintUs = sprint.user_stories[0]

            ctrl.moveUs("sprint:us:move", [sprintUs], 1, null, 1, 2)

            expect(sprint.user_stories).to.be.eql([])
            expect(_.map(scope.userstories, "id")).to.be.eql([1, 50, 2, 3])
            expect(mocks.rs.userstories.bulkUpdateBacklogOrder).to.have.been.calledWith(1, null, 1, 2, [50])

        it "reorders the backlog after the previous user story", ->
            ctrl.moveUs("sprint:us:move", [us3], 1, null, 1, 2)

            expect(_.map(scope.userstories, "id")).to.be.eql([1, 3, 2])
            expect(mocks.rs.userstories.bulkUpdateBacklogOrder).to.have.been.calledWith(1, null, 1, 2, [3])

        it "reorders several user stories together", ->
            ctrl.moveUs("sprint:us:move", [us2, us3], 0, null, null, 1)

            expect(_.map(scope.userstories, "id")).to.be.eql([2, 3, 1])
            expect(mocks.rs.userstories.bulkUpdateBacklogOrder).to.have.been.calledWith(1, null, null, 1, [2, 3])

        it "reorders inside a sprint", ->
            a = {id: 60, milestone: 5, project: 1}
            b = {id: 61, milestone: 5, project: 1}
            sprint.user_stories = [a, b]

            ctrl.moveUs("sprint:us:move", [b], 0, 5, null, 60)

            expect(_.map(sprint.user_stories, "id")).to.be.eql([61, 60])

        it "NOTE (current behaviour): with neither previous nor next, inserts at index 1", ->
            # position starts at 0, then is unconditionally incremented
            ctrl.moveUs("sprint:us:move", [us3], 0, null, null, null)

            expect(_.map(scope.userstories, "id")).to.be.eql([1, 3, 2])

        it "applies the server's order and milestone once the update succeeds", ->
            moved = sinon.stub()
            $rootScope.$on("sprint:us:moved", moved)

            ctrl.moveUs("sprint:us:move", [us2], 0, 5, null, 50)
            bulkUpdate.resolve({data: [{id: 2, milestone: 5, backlog_order: 77}]})
            $rootScope.$digest()

            expect(us2.backlog_order).to.be.equal(77)
            expect(ctrl.pendingDrag).to.be.eql([])
            expect(moved).to.have.been.calledOnce

        it "relies on events to refresh when connected", ->
            mocks.events.connected = true
            mocks.rs.sprints.list.reset()

            ctrl.moveUs("sprint:us:move", [us2], 0, 5, null, 50)
            bulkUpdate.resolve({data: []})
            $rootScope.$digest()

            expect(mocks.rs.sprints.list).not.to.have.been.called

        it "reloads sprints, closed sprints and stats itself when events are not connected", ->
            mocks.events.connected = false
            mocks.rs.sprints.list.reset()
            mocks.rs.sprints.list.returns($q.when({milestones: [], open: 0, closed: 0}))
            mocks.rs.projects.stats.reset()
            mocks.rs.projects.stats.returns($q.when(buildStats()))

            ctrl.moveUs("sprint:us:move", [us2], 0, 5, null, 50)
            bulkUpdate.resolve({data: []})
            $rootScope.$digest()

            expect(mocks.rs.sprints.list).to.have.been.calledWith(1, {closed: false})
            expect(mocks.rs.sprints.list).to.have.been.calledWith(1, {closed: true})
            expect(mocks.rs.projects.stats).to.have.been.called

        it "queues a second move until the first one is saved", ->
            second = $q.defer()
            mocks.rs.userstories.bulkUpdateBacklogOrder.onCall(1).returns(second.promise)

            ctrl.moveUs("sprint:us:move", [us2], 0, 5, null, 50)
            ctrl.moveUs("sprint:us:move", [us3], 0, 5, null, 2)

            # both optimistic moves are applied immediately...
            expect(_.map(sprint.user_stories, "id")).to.be.eql([3, 2, 50])
            # ...but only the first one hits the API
            expect(mocks.rs.userstories.bulkUpdateBacklogOrder).to.have.been.calledOnce
            expect(ctrl.pendingDrag.length).to.be.equal(2)

            bulkUpdate.resolve({data: []})
            $rootScope.$digest()
            # the replay is scheduled with $applyAsync, flushed by the next digest
            $rootScope.$digest()

            expect(mocks.rs.userstories.bulkUpdateBacklogOrder).to.have.been.calledTwice
            expect(mocks.rs.userstories.bulkUpdateBacklogOrder.secondCall.args).to.be.eql([1, 5, null, 2, [3]])
            # the replay doesn't re-apply the optimistic move
            expect(_.map(sprint.user_stories, "id")).to.be.eql([3, 2, 50])

        it "asks closed sprints to reload when moving out of a closed sprint", ->
            closedSprint = {id: 7, closed: true, user_stories: [{id: 70, milestone: 7, project: 1}]}
            scope.closedSprintsById = {7: closedSprint}
            listener = sinon.stub()
            $rootScope.$on("backlog:load-closed-sprints", listener)

            ctrl.moveUs("sprint:us:move", [closedSprint.user_stories[0]], 0, null, null, 1)
            bulkUpdate.resolve({data: []})
            $rootScope.$digest()

            expect(listener).to.have.been.called

        it "is wired to the sprint:us:move event", ->
            scope.$broadcast("sprint:us:move", [us2], 0, 5, null, 50)

            expect(mocks.rs.userstories.bulkUpdateBacklogOrder).to.have.been.calledWith(1, 5, null, 50, [2])

    describe "moveUsToTopOfBacklog", ->
        it "moves the given user stories before the current first one", ->
            ctrl = createController()
            us1 = {id: 1, project: 1, milestone: null}
            newUs = {id: 9, project: 1, milestone: null}
            scope.userstories = [us1]
            mocks.rs.userstories.bulkUpdateBacklogOrder.returns($q.defer().promise)

            ctrl.moveUsToTopOfBacklog(newUs)

            expect(mocks.rs.userstories.bulkUpdateBacklogOrder).to.have.been.calledWith(1, null, null, 1, [9])

        it "does nothing on an empty backlog", ->
            ctrl = createController()
            scope.userstories = []

            ctrl.moveUsToTopOfBacklog([{id: 9}])

            expect(mocks.rs.userstories.bulkUpdateBacklogOrder).not.to.have.been.called

    ##########################################################################
    ## Template actions
    ##########################################################################

    describe "deleteUserStory", ->
        it "removes the user story after confirmation and reloads stats and sprints", ->
            ctrl = createController()
            us = {id: 1, subject: "Subject"}
            scope.userstories = [us, {id: 2}]
            askResponse = {finish: sinon.stub()}
            mocks.confirm.askOnDelete.returns($q.when(askResponse))
            mocks.repo.remove.returns($q.when())
            mocks.rs.projects.stats.reset()
            mocks.rs.projects.stats.returns($q.when(buildStats()))

            ctrl.deleteUserStory(us)
            $rootScope.$digest()

            expect(mocks.translate.instant).to.have.been.calledWith(
                "US.TITLE_DELETE_MESSAGE", {subject: "Subject"})
            expect(_.map(scope.userstories, "id")).to.be.eql([2])
            expect(mocks.repo.remove).to.have.been.calledWith(us)
            expect(askResponse.finish).to.have.been.calledWith()
            expect(mocks.rs.projects.stats).to.have.been.called

        it "notifies an error when the removal fails", ->
            ctrl = createController()
            us = {id: 1, subject: "Subject"}
            scope.userstories = [us]
            askResponse = {finish: sinon.stub()}
            mocks.confirm.askOnDelete.returns($q.when(askResponse))
            mocks.repo.remove.returns($q.reject())

            ctrl.deleteUserStory(us)
            $rootScope.$digest()

            expect(askResponse.finish).to.have.been.calledWith(false)
            expect(mocks.confirm.notify).to.have.been.calledWith("error")
            # NOTE (current behaviour): the optimistic removal is not rolled back
            expect(scope.userstories).to.be.eql([])

    describe "editUserStory", ->
        it "loads the user story and its attachments, then opens the generic form", ->
            ctrl = createController()
            us = {id: 3}
            mocks.rs.userstories.getByRef.returns($q.when(us))
            mocks.rs2.attachments.list.returns($q.when(Immutable.fromJS([{id: 1}])))
            listener = sinon.stub()
            $rootScope.$on("genericform:edit", listener)

            ctrl.editUserStory(1, 30)
            $rootScope.$digest()

            expect(mocks.rs.userstories.getByRef).to.have.been.calledWith(1, 30)
            expect(mocks.rs2.attachments.list).to.have.been.calledWith("us", 3, 1)
            expect(listener.args[0][1]).to.be.eql({objType: "us", obj: us, attachments: [{id: 1}]})

    describe "addNewUs / addNewSprint", ->
        it "opens the generic form for a standard user story", ->
            ctrl = createController()
            listener = sinon.stub()
            $rootScope.$on("genericform:new", listener)

            ctrl.addNewUs("standard")

            expect(listener.args[0][1]).to.be.eql({objType: "us", project: scope.project})

        it "opens the bulk form with the default status", ->
            ctrl = createController()
            listener = sinon.stub()
            $rootScope.$on("usform:bulk", listener)

            ctrl.addNewUs("bulk")

            expect(listener.args[0].slice(1)).to.be.eql([1, 10])

        it "opens the sprint form", ->
            ctrl = createController()
            listener = sinon.stub()
            $rootScope.$on("sprintform:create", listener)

            ctrl.addNewSprint()

            expect(listener.args[0][1]).to.be.equal(1)

    ##########################################################################
    ## Events from lightboxes / child directives
    ##########################################################################

    describe "scope events", ->
        it "usform:edit:success replaces the edited user story in place", ->
            ctrl = createController()
            scope.userstories = [{id: 1, subject: "old"}, {id: 2}]

            scope.$broadcast("usform:edit:success", {id: 1, subject: "new"})

            expect(scope.userstories[0].subject).to.be.equal("new")

        it "usform:new:success reloads the backlog and flags the new user story", ->
            ctrl = createController()
            mocks.rs.userstories.listUnassigned.reset()
            mocks.rs.userstories.listUnassigned.returns($q.when([[], headerFn()]))

            scope.$broadcast("usform:new:success", {id: 9})

            expect(ctrl.newUs).to.be.eql([9])
            expect(mocks.rs.userstories.listUnassigned).to.have.been.calledWith(1, sinon.match({page: 1}))
            expect(mocks.analytics.trackEvent).to.have.been.calledWith("userstory", "create")

        it "usform:new:success with position top moves it first, then reloads", ->
            ctrl = createController()
            scope.userstories = [{id: 1, project: 1, milestone: null}]
            bulkUpdate = $q.defer()
            mocks.rs.userstories.bulkUpdateBacklogOrder.returns(bulkUpdate.promise)
            mocks.rs.userstories.listUnassigned.reset()
            mocks.rs.userstories.listUnassigned.returns($q.when([[], headerFn()]))

            scope.$broadcast("usform:new:success", {id: 9, project: 1, milestone: null}, "top")

            expect(mocks.rs.userstories.bulkUpdateBacklogOrder).to.have.been.calledWith(1, null, null, 1, [9])
            expect(mocks.rs.userstories.listUnassigned).not.to.have.been.called

            bulkUpdate.resolve({data: []})
            $rootScope.$digest()

            expect(mocks.rs.userstories.listUnassigned).to.have.been.called

        it "usform:bulk:success flags all the created user stories", ->
            ctrl = createController()

            scope.$broadcast("usform:bulk:success", [{id: 7}, {id: 8}])

            expect(ctrl.newUs).to.be.eql([7, 8])

        it "sprintform:create:success reloads sprints, then calls back with the user stories to move", ->
            ctrl = createController()
            callback = sinon.stub()
            scope.$on("sprintform:create:success:callback", callback)

            scope.$broadcast("sprintform:create:success", {}, [{id: 1}])
            $rootScope.$digest()

            expect(mocks.confirm.notify).to.have.been.calledWith("success")
            expect(callback.args[0][1]).to.be.eql([{id: 1}])

        it "sprintform:remove:success reloads everything and hides the forecast", ->
            ctrl = createController()
            ctrl.displayVelocity = true
            scope.stats = buildStats()
            mocks.rs.sprints.list.reset()
            mocks.rs.sprints.list.returns($q.when({milestones: [], open: 0, closed: 0}))

            scope.$broadcast("sprintform:remove:success", {id: 5, closed: true})

            expect(ctrl.displayVelocity).to.be.false
            expect(mocks.rs.sprints.list).to.have.been.calledWith(1, {closed: false})
            expect(mocks.rs.sprints.list).to.have.been.calledWith(1, {closed: true})

        it "sprint:us:moved resets the first-story indicator", ->
            ctrl = createController()
            scope.userstories = [{id: 4}]

            scope.$broadcast("sprint:us:moved")

            expect(scope.first_us_in_backlog).to.be.equal(4)

    ##########################################################################
    ## Filters
    ##########################################################################

    describe "filters", ->
        it "addFilterBacklog selects the filter, reloads and regenerates filters without milestone", ->
            ctrl = createController()
            mocks.rs.userstories.filtersData.reset()
            mocks.rs.userstories.filtersData.returns($q.when({}))

            ctrl.addFilterBacklog({category: {dataType: "status"}, filter: {id: 3}, mode: "include"})

            expect(mocks.location.search).to.have.been.calledWith("status", 3)
            expect(mocks.rs.userstories.filtersData).to.have.been.calledWith(sinon.match({milestone: "null"}))

        it "removeFilterBacklog unselects the filter", ->
            ctrl = createController({searchParams: {status: "3,4"}})

            ctrl.removeFilterBacklog({dataType: "status", id: 3, mode: "include"})

            expect(mocks.location.search).to.have.been.calledWith("status", "4")
