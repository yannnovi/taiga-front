###
# This source code is licensed under the terms of the
# GNU Affero General Public License found in the LICENSE file in
# the root directory of this source tree.
#
# Copyright (c) 2021-present Kaleidos INC
###

# Specs for tgBacklog's "move to sprint" toolbar (backlog/main.coffee, linkToolbar) - the
# backlog -> sprint paths that still work without drag & drop. Phase 3 safety net before
# migrating the sprint table, see MIGRATION_ROADMAP.md. Oddities kept as-is are flagged
# "NOTE (current behaviour)".

describe "tgBacklog toolbar (move to sprint)", ->
    $compile = null
    $rootScope = null
    $q = null
    mocks = null

    html = """
        <div tg-backlog>
            <div class="backlog-table-body">
                <div class="row us-item-row" data-id="1"><input type="checkbox" /></div>
                <div class="row us-item-row" data-id="2"><input type="checkbox" /></div>
                <div class="row us-item-row" data-id="3"><input type="checkbox" /></div>
            </div>
            <button class="move-to-sprint" id="move-to-current-sprint"></button>
            <button class="move-to-sprint" id="move-to-latest-sprint"></button>
            <div class="forecasting-add-sprint"></div>
        </div>
    """

    beforeEach ->
        mocks = {
            rs: {userstories: {bulkUpdateMilestone: sinon.stub()}}
            ctrl: {
                location: {search: sinon.stub().returns({})}
                loadSprints: sinon.stub()
                loadProjectStats: sinon.stub()
                toggleVelocityForecasting: sinon.stub()
                calculateForecasting: sinon.stub()
                toggleShowTags: sinon.stub()
                forecastedStories: []
            }
        }

        module "taigaBacklog", ($provide) ->
            $provide.value("$tgRepo", {})
            $provide.value("$translate", {instant: (key) -> key})
            $provide.value("$tgResources", mocks.rs)
            return null

        inject (_$compile_, _$rootScope_, _$q_) ->
            $compile = _$compile_
            $rootScope = _$rootScope_
            $q = _$q_

        mocks.rs.userstories.bulkUpdateMilestone.returns($q.when())

    afterEach ->
        $(window).off(".shift-pressed")

    buildScope = ->
        scope = $rootScope.$new()
        scope.project = {id: 1}
        scope.projectId = 1
        scope.userstories = [
            {id: 1, total_points: 1, sprint_order: 10, milestone: null}
            {id: 2, total_points: 2, sprint_order: 20, milestone: null}
            {id: 3, total_points: 4, sprint_order: 30, milestone: null}
        ]
        scope.sprints = [
            {id: 50, total_points: 10, user_stories: [{id: 99}]}
            {id: 40, total_points: 0, user_stories: []}
        ]
        return scope

    compile = (scope) ->
        el = angular.element(html)
        # tgBacklog reads BacklogController through $el.controller()
        el.data("$ngControllerController", mocks.ctrl)
        $compile(el)(scope)
        scope.$digest()
        return el

    check = (el, id) ->
        input = el.find(".us-item-row[data-id='#{id}'] input")
        input.prop("checked", true)
        input.trigger("change")

    describe "selection", ->
        it "shows the move-to-sprint buttons while a user story is checked", ->
            el = compile(buildScope())

            check(el, 2)

            row = el.find(".us-item-row[data-id='2']")
            expect(row.hasClass("is-checked")).to.be.true
            expect(row.hasClass("ui-multisortable-multiple")).to.be.true
            expect(el.find("#move-to-latest-sprint").css("display")).to.be.equal("flex")

        it "hides them again once nothing is checked", ->
            el = compile(buildScope())
            check(el, 2)

            input = el.find(".us-item-row[data-id='2'] input")
            input.prop("checked", false)
            input.trigger("change")

            expect(el.find("#move-to-latest-sprint").css("display")).to.be.equal("none")

        it "does not show them when there is no sprint", ->
            scope = buildScope()
            scope.sprints = []
            el = compile(scope)

            check(el, 2)

            expect(el.find("#move-to-latest-sprint").css("display")).not.to.be.equal("flex")

    describe "move to latest sprint button", ->
        it "moves the checked user stories into the latest sprint", ->
            scope = buildScope()
            el = compile(scope)
            check(el, 1)
            check(el, 3)

            el.find("#move-to-latest-sprint").trigger("click")

            expect(_.map(scope.userstories, "id")).to.be.eql([2])
            expect(_.map(scope.sprints[0].user_stories, "id")).to.be.eql([99, 1, 3])
            expect(scope.sprints[0].total_points).to.be.equal(15)
            expect(mocks.rs.userstories.bulkUpdateMilestone).to.have.been.calledWith(1, 50, [
                {us_id: 1, order: 10}
                {us_id: 3, order: 30}
            ])

        it "reloads sprints, stats and the forecast once saved", ->
            scope = buildScope()
            el = compile(scope)
            check(el, 1)

            el.find("#move-to-latest-sprint").trigger("click")
            scope.$digest()

            expect(mocks.ctrl.loadSprints).to.have.been.called
            expect(mocks.ctrl.loadProjectStats).to.have.been.called
            expect(mocks.ctrl.toggleVelocityForecasting).to.have.been.called
            expect(mocks.ctrl.calculateForecasting).to.have.been.called
            expect(el.find("#move-to-latest-sprint").css("display")).to.be.equal("none")

    describe "move to current sprint button", ->
        it "moves the checked user stories into the current sprint", ->
            scope = buildScope()
            scope.currentSprint = scope.sprints[1]
            el = compile(scope)
            check(el, 2)

            el.find("#move-to-current-sprint").trigger("click")

            expect(_.map(scope.userstories, "id")).to.be.eql([1, 3])
            expect(_.map(scope.sprints[1].user_stories, "id")).to.be.eql([2])

        it "NOTE (current behaviour): saves against the latest sprint, not the current one", ->
            # moveUssToSprint() moves them locally into the target sprint, but the API call
            # (and getUsToMove's us.milestone) always use $scope.sprints[0] - the next sprints
            # reload then shows them in the latest sprint, whatever the current one is.
            scope = buildScope()
            scope.currentSprint = scope.sprints[1]
            el = compile(scope)
            check(el, 2)

            el.find("#move-to-current-sprint").trigger("click")

            expect(mocks.rs.userstories.bulkUpdateMilestone).to.have.been.calledWith(1, 50)
            expect(_.find(scope.sprints[1].user_stories, {id: 2}).milestone).to.be.equal(50)

    describe "after creating a sprint", ->
        it "moves the pending user stories into the new sprint", ->
            scope = buildScope()
            compile(scope)
            ussToMove = [scope.userstories[0]]

            scope.$broadcast("sprintform:create:success:callback", ussToMove)

            expect(_.map(scope.userstories, "id")).to.be.eql([2, 3])
            expect(_.map(scope.sprints[0].user_stories, "id")).to.be.eql([99, 1])

        it "does nothing without user stories to move", ->
            scope = buildScope()
            compile(scope)

            scope.$broadcast("sprintform:create:success:callback", undefined)

            expect(mocks.rs.userstories.bulkUpdateMilestone).not.to.have.been.called

    describe "forecasting 'add to sprint'", ->
        it "moves the forecasted user stories into the sprint when it has room", ->
            scope = buildScope()
            scope.forecastNewSprint = false
            mocks.ctrl.forecastedStories = [scope.userstories[0], scope.userstories[1]]
            el = compile(scope)

            el.find(".forecasting-add-sprint").trigger("click")

            expect(_.map(scope.userstories, "id")).to.be.eql([3])
            expect(scope.sprints[0].user_stories[1].order).to.be.equal(0)
            expect(scope.sprints[0].user_stories[2].order).to.be.equal(1)
            expect(mocks.rs.userstories.bulkUpdateMilestone).to.have.been.calledWith(1, 50)

        it "opens the new sprint form with the forecasted user stories otherwise", ->
            scope = buildScope()
            scope.forecastNewSprint = true
            mocks.ctrl.forecastedStories = [scope.userstories[0]]
            el = compile(scope)
            listener = sinon.stub()
            $rootScope.$on("sprintform:create", listener)

            el.find(".forecasting-add-sprint").trigger("click")

            expect(listener.args[0][1]).to.be.equal(1)
            expect(_.map(listener.args[0][2], "id")).to.be.eql([1])
            expect(mocks.rs.userstories.bulkUpdateMilestone).not.to.have.been.called
