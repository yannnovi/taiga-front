###
# This source code is licensed under the terms of the
# GNU Affero General Public License found in the LICENSE file in
# the root directory of this source tree.
#
# Copyright (c) 2021-present Kaleidos INC
###

taiga = @.taiga

mixOf = @.taiga.mixOf
bindMethods = @.taiga.bindMethods

module = angular.module("taigaAdmin")


#############################################################################
## Webhooks
#############################################################################

class WebhooksController extends mixOf(taiga.Controller, taiga.PageMixin, taiga.FiltersMixin)
    @.$inject = [
        "$scope",
        "$tgRepo",
        "$tgResources",
        "$routeParams",
        "$tgLocation",
        "$tgNavUrls",
        "tgAppMetaService",
        "$translate",
        "tgErrorHandlingService",
        "tgProjectService"
    ]

    constructor: (@scope, @repo, @rs, @params, @location, @navUrls, @appMetaService, @translate, @errorHandlingService, @projectService) ->
        bindMethods(@)

        @scope.sectionName = "ADMIN.WEBHOOKS.SECTION_NAME"
        @scope.project = {}

        promise = @.loadInitialData()

        promise.then () =>
            title = @translate.instant("ADMIN.WEBHOOKS.PAGE_TITLE", {projectName: @scope.project.name})
            description = @scope.project.description
            @appMetaService.setAll(title, description)

        promise.then null, @.onInitialDataError.bind(@)

        @scope.$on "webhooks:reload", @.loadWebhooks

    loadWebhooks: ->
        return @rs.webhooks.list(@scope.projectId).then (webhooks) =>
            @scope.webhooks = webhooks

    loadProject: ->
        project = @projectService.project.toJS()

        if not project.i_am_admin
            @errorHandlingService.permissionDenied()

        @scope.projectId = project.id
        @scope.project = project
        @scope.$emit('project:loaded', project)
        return project

    loadInitialData: ->
        @.loadProject()

        return @.loadWebhooks()

module.controller("WebhooksController", WebhooksController)

#############################################################################
## Github Controller
#############################################################################

class GithubController extends mixOf(taiga.Controller, taiga.PageMixin, taiga.FiltersMixin)
    @.$inject = [
        "$scope",
        "$tgRepo",
        "$tgResources",
        "$routeParams",
        "tgAppMetaService",
        "$translate",
        "tgProjectService"
    ]

    constructor: (@scope, @repo, @rs, @params, @appMetaService, @translate, @projectService) ->
        bindMethods(@)

        @scope.sectionName = @translate.instant("ADMIN.GITHUB.SECTION_NAME")
        @scope.project = {}

        promise = @.loadInitialData()

        promise.then () =>
            title = @translate.instant("ADMIN.GITHUB.PAGE_TITLE", {projectName: @scope.project.name})
            description = @scope.project.description
            @appMetaService.setAll(title, description)

        promise.then null, @.onInitialDataError.bind(@)

    loadModules: ->
        return @rs.modules.list(@scope.projectId, "github").then (github) =>
            @scope.github = github

    loadProject: ->
        project = @projectService.project.toJS()

        @scope.projectId = project.id
        @scope.project = project
        @scope.$emit('project:loaded', project)
        return project

    loadInitialData: ->
        promise = @.loadProject()
        return @.loadModules()

module.controller("GithubController", GithubController)


#############################################################################
## Gitlab Controller
#############################################################################

class GitlabController extends mixOf(taiga.Controller, taiga.PageMixin, taiga.FiltersMixin)
    @.$inject = [
        "$scope",
        "$tgRepo",
        "$tgResources",
        "$routeParams",
        "tgAppMetaService",
        "$translate",
        "tgProjectService"
    ]

    constructor: (@scope, @repo, @rs, @params, @appMetaService, @translate, @projectService) ->
        bindMethods(@)

        @scope.sectionName = @translate.instant("ADMIN.GITLAB.SECTION_NAME")
        @scope.project = {}
        promise = @.loadInitialData()

        promise.then () =>
            title = @translate.instant("ADMIN.GITLAB.PAGE_TITLE", {projectName: @scope.project.name})
            description = @scope.project.description
            @appMetaService.setAll(title, description)

        promise.then null, @.onInitialDataError.bind(@)

        @scope.$on "project:modules:reload", =>
            @.loadModules()

    loadModules: ->
        return @rs.modules.list(@scope.projectId, "gitlab").then (gitlab) =>
            @scope.gitlab = gitlab

    loadProject: ->
        project = @projectService.project.toJS()

        @scope.projectId = project.id
        @scope.project = project
        @scope.$emit('project:loaded', project)
        return project

    loadInitialData: ->
        @.loadProject()
        return @.loadModules()

module.controller("GitlabController", GitlabController)


#############################################################################
## Bitbucket Controller
#############################################################################

class BitbucketController extends mixOf(taiga.Controller, taiga.PageMixin, taiga.FiltersMixin)
    @.$inject = [
        "$scope",
        "$tgRepo",
        "$tgResources",
        "$routeParams",
        "tgAppMetaService",
        "$translate",
        "tgProjectService"
    ]

    constructor: (@scope, @repo, @rs, @params, @appMetaService, @translate, @projectService) ->
        bindMethods(@)

        @scope.sectionName = @translate.instant("ADMIN.BITBUCKET.SECTION_NAME")
        @scope.project = {}
        promise = @.loadInitialData()

        promise.then () =>
            title = @translate.instant("ADMIN.BITBUCKET.PAGE_TITLE", {projectName: @scope.project.name})
            description = @scope.project.description
            @appMetaService.setAll(title, description)

        promise.then null, @.onInitialDataError.bind(@)

        @scope.$on "project:modules:reload", =>
            @.loadModules()

    loadModules: ->
        return @rs.modules.list(@scope.projectId, "bitbucket").then (bitbucket) =>
            @scope.bitbucket = bitbucket

    loadProject: ->
        project = @projectService.project.toJS()

        @scope.projectId = project.id
        @scope.project = project
        @scope.$emit('project:loaded', project)
        return project

    loadInitialData: ->
        @.loadProject()
        return @.loadModules()

module.controller("BitbucketController", BitbucketController)


SelectInputText = ($translate, $confirm)->
    link = ($scope, $el, $attrs) ->
        $el.on "click", ".select-input-content", () ->
            source = $el.find("input")
            if !source.val()
                return

            source.select()
            document.execCommand 'copy'
            $confirm.notify("success", $translate.instant("COMMON.COPIED_TO_CLIPBOARD"))

    return {link:link}

module.directive("tgSelectInputText", ["$translate", "$tgConfirm", SelectInputText])


#############################################################################
## Gogs Controller
#############################################################################

class GogsController extends mixOf(taiga.Controller, taiga.PageMixin, taiga.FiltersMixin)
    @.$inject = [
        "$scope",
        "$tgRepo",
        "$tgResources",
        "$routeParams",
        "tgAppMetaService",
        "$translate",
        "tgProjectService"
    ]

    constructor: (@scope, @repo, @rs, @params, @appMetaService, @translate, @projectService) ->
        bindMethods(@)

        @scope.sectionName = @translate.instant("ADMIN.GOGS.SECTION_NAME")
        @scope.project = {}

        promise = @.loadInitialData()

        promise.then () =>
            title = @translate.instant("ADMIN.GOGS.PAGE_TITLE", {projectName: @scope.project.name})
            description = @scope.project.description
            @appMetaService.setAll(title, description)

        promise.then null, @.onInitialDataError.bind(@)

    loadModules: ->
        return @rs.modules.list(@scope.projectId, "gogs").then (gogs) =>
            @scope.gogs = gogs

    loadProject: ->
        project = @projectService.project.toJS()

        @scope.projectId = project.id
        @scope.project = project
        @scope.$emit('project:loaded', project)
        return project

    loadInitialData: ->
        @.loadProject()
        return @.loadModules()

module.controller("GogsController", GogsController)
