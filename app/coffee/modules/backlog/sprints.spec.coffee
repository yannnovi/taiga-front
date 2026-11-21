###
# This source code is licensed under the terms of the
# GNU Affero General Public License found in the LICENSE file in
# the root directory of this source tree.
#
# Copyright (c) 2021-present Kaleidos INC
###

# Characterization specs for the backlog sprint sidebar directives (backlog/sprints.coffee),
# Phase 3 safety net before migrating the sprint table - see MIGRATION_ROADMAP.md.
# Oddities kept as-is are flagged "NOTE (current behaviour)".

describe "backlog sprint directives", ->
    $compile = null
    $rootScope = null
    mocks = null

    beforeEach ->
        mocks = {
            navUrls: {resolve: sinon.spy (name, params) -> "/#{name}/#{params.project}/#{params.sprint}"}
            translate: {instant: sinon.spy (key) -> if key == "BACKLOG.SPRINTS.DATE" then "DD MMM YYYY" else key}
            template: {get: sinon.stub()}
            loadingInstance: {target: null, start: null, finish: sinon.stub()}
        }
        mocks.loadingInstance.target = sinon.stub().returns(mocks.loadingInstance)
        mocks.loadingInstance.start = sinon.stub().returns(mocks.loadingInstance)
        mocks.loading = sinon.stub().returns(mocks.loadingInstance)

        mocks.template.get.withArgs("backlog/sprint-header.html").returns(
            """
            <div>
                <span class="name">{{name}}</span>
                <span class="url">{{taskboardUrl}}</span>
                <span class="dates">{{estimatedDateRange}}</span>
                <span class="closed">{{closedPoints}}</span>
                <span class="total">{{totalPoints}}</span>
                <span class="visible">{{isVisible}}</span>
                <span class="editable">{{isEditable}}</span>
            </div>
            """
        )

        module "taigaBacklog", ($provide) ->
            $provide.value("$tgRepo", {})
            $provide.value("$tgNavUrls", mocks.navUrls)
            $provide.value("$translate", mocks.translate)
            $provide.value("$tgTemplate", mocks.template)
            $provide.value("$tgLoading", mocks.loading)
            return null

        inject (_$compile_, _$rootScope_) ->
            $compile = _$compile_
            $rootScope = _$rootScope_

    compile = (html, scopeValues = {}) ->
        scope = $rootScope.$new()
        _.assign(scope, scopeValues)
        el = $compile(html)(scope)
        scope.$digest()
        return {el: el, scope: scope}

    ##########################################################################
    ## tgBacklogSprint
    ##########################################################################

    describe "tgBacklogSprint", ->
        html = """
            <div tg-backlog-sprint="sprint">
                <div class="sprint-name"><button class="compact-sprint"></button></div>
                <a class="edit-sprint" href=""></a>
                <div class="sprint-table"></div>
            </div>
        """

        it "renders an open sprint expanded", ->
            {el} = compile(html, {sprint: {id: 1, closed: false}})

            expect(el.find(".sprint-table").hasClass("open")).to.be.true
            expect(el.find(".compact-sprint").hasClass("active")).to.be.true
            expect(el.hasClass("sprint-closed")).to.be.false

        it "renders a closed sprint collapsed and flagged", ->
            {el} = compile(html, {sprint: {id: 1, closed: true}})

            expect(el.hasClass("sprint-closed")).to.be.true
            expect(el.find(".sprint-table").hasClass("open")).to.be.false

        it "toggles the sprint when clicking the compact arrow", ->
            {el} = compile(html, {sprint: {id: 1, closed: false}})

            el.find(".compact-sprint").trigger("click")

            expect(el.find(".sprint-table").hasClass("open")).to.be.false
            expect(el.find(".compact-sprint").hasClass("active")).to.be.false

        it "opens the sprint edit form", ->
            sprint = {id: 1, closed: false}
            {el} = compile(html, {sprint: sprint})
            listener = sinon.stub()
            $rootScope.$on("sprintform:edit", listener)

            el.find(".edit-sprint").trigger("click")

            expect(listener.args[0][1]).to.be.equal(sprint)

        it "NOTE (current behaviour): a new sprint object (sprints reload) toggles an open sprint again", ->
            # loadSprints() replaces every sprint object; ng-repeat (track by id) keeps the
            # same element, but the watch fires on the new reference and toggles once more -
            # an expanded open sprint collapses after a reload.
            {el, scope} = compile(html, {sprint: {id: 1, closed: false}})

            scope.sprint = {id: 1, closed: false}
            scope.$digest()

            expect(el.find(".sprint-table").hasClass("open")).to.be.false

    ##########################################################################
    ## tgBacklogSprintHeader
    ##########################################################################

    describe "tgBacklogSprintHeader", ->
        buildScope = (projectOverrides = {}, sprintOverrides = {}) ->
            return {
                project: _.assign({
                    slug: "project-slug"
                    archived_code: null
                    my_permissions: ["view_milestones", "modify_milestone"]
                }, projectOverrides)
                sprint: _.assign({
                    name: "Sprint 1"
                    slug: "sprint-1"
                    estimated_start: "2026-01-05"
                    estimated_finish: "2026-01-19"
                    closed_points: 3
                    total_points: 8
                }, sprintOverrides)
            }

        it "renders the sprint summary", ->
            {el} = compile("<header tg-backlog-sprint-header></header>", buildScope())

            expect(el.find(".name").text()).to.be.equal("Sprint 1")
            expect(el.find(".url").text()).to.be.equal("/project-taskboard/project-slug/sprint-1")
            expect(el.find(".dates").text()).to.be.equal("05 Jan 2026-19 Jan 2026")
            expect(el.find(".closed").text()).to.be.equal("3")
            expect(el.find(".total").text()).to.be.equal("8")
            expect(el.find(".visible").text()).to.be.equal("true")
            expect(el.find(".editable").text()).to.be.equal("true")

        it "defaults missing points to 0", ->
            {el} = compile("<header tg-backlog-sprint-header></header>",
                           buildScope({}, {closed_points: null, total_points: undefined}))

            expect(el.find(".closed").text()).to.be.equal("0")
            expect(el.find(".total").text()).to.be.equal("0")

        it "is not editable without modify_milestone", ->
            {el} = compile("<header tg-backlog-sprint-header></header>",
                           buildScope({my_permissions: ["view_milestones"]}))

            expect(el.find(".editable").text()).to.be.equal("false")
            expect(el.find(".visible").text()).to.be.equal("true")

        it "is not editable on an archived project", ->
            {el} = compile("<header tg-backlog-sprint-header></header>",
                           buildScope({archived_code: "x"}))

            expect(el.find(".editable").text()).to.be.equal("false")

        it "hides the taskboard link without view_milestones", ->
            {el} = compile("<header tg-backlog-sprint-header></header>",
                           buildScope({my_permissions: []}))

            expect(el.find(".visible").text()).to.be.equal("false")

        it "re-renders when the sprint changes", ->
            {el, scope} = compile("<header tg-backlog-sprint-header></header>", buildScope())

            scope.sprint = _.assign({}, scope.sprint, {name: "Renamed", total_points: 13})
            scope.$digest()

            expect(el.find(".name").text()).to.be.equal("Renamed")
            expect(el.find(".total").text()).to.be.equal("13")

    ##########################################################################
    ## tgBacklogToggleClosedSprintsVisualization
    ##########################################################################

    describe "tgBacklogToggleClosedSprintsVisualization", ->
        html = """
            <div><a tg-backlog-toggle-closed-sprints-visualization href=""><span class="text"></span></a></div>
        """

        clickAndGetEvent = (link) ->
            load = sinon.stub()
            unload = sinon.stub()
            off1 = $rootScope.$on("backlog:load-closed-sprints", load)
            off2 = $rootScope.$on("backlog:unload-closed-sprints", unload)

            link.trigger("click")

            off1()
            off2()

            return "load" if load.called
            return "unload" if unload.called
            return null

        it "alternates between loading and unloading closed sprints, starting hidden", ->
            {el} = compile(html)
            link = el.find("a")

            expect(clickAndGetEvent(link)).to.be.equal("load")
            expect(clickAndGetEvent(link)).to.be.equal("unload")
            expect(clickAndGetEvent(link)).to.be.equal("load")

        it "NOTE (current behaviour): the shown/hidden state is shared by all instances", ->
            # it lives in the directive factory closure (one per injector, i.e. for the whole
            # app lifetime), not per element - it also survives leaving and re-entering the
            # backlog page, while the controller starts again with closed sprints hidden.
            first = compile(html).el.find("a")
            clickAndGetEvent(first)

            second = compile(html).el.find("a")

            expect(clickAndGetEvent(second)).to.be.equal("unload")

        it "shows a loading indicator until closed sprints are reloaded", ->
            {el, scope} = compile(html)

            el.find("a").trigger("click")

            expect(mocks.loading).to.have.been.called
            expect(mocks.loadingInstance.start).to.have.been.called

            scope.$broadcast("closed-sprints:reloaded", [])

            expect(mocks.loadingInstance.finish).to.have.been.called

        it "updates the label from the reloaded closed sprints", ->
            {el, scope} = compile(html)

            scope.$broadcast("closed-sprints:reloaded", [{id: 1}])
            expect(el.find(".text").text()).to.be.equal("BACKLOG.SPRINTS.ACTION_HIDE_CLOSED_SPRINTS")

            scope.$broadcast("closed-sprints:reloaded", [])
            expect(el.find(".text").text()).to.be.equal("BACKLOG.SPRINTS.ACTION_SHOW_CLOSED_SPRINTS")

    ##########################################################################
    ## tgSprint
    ##########################################################################

    describe "tgSprint", ->
        it "has an isolated scope with sprint and project bindings", ->
            inject (tgSprintDirective) ->
                directive = tgSprintDirective[0]

                expect(directive.templateUrl).to.be.equal("backlog/sprint.html")
                expect(directive.scope).to.be.eql({sprint: "=", project: "="})
