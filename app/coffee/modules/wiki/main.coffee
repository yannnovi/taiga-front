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
bindOnce = @.taiga.bindOnce
debounce = @.taiga.debounce

module = angular.module("taigaWiki")

#############################################################################
## Wiki Detail Controller
#############################################################################

class WikiDetailController extends mixOf(taiga.Controller, taiga.PageMixin)
    @.$inject = [
        "$scope",
        "$rootScope",
        "$tgRepo",
        "$tgModel",
        "$tgConfirm",
        "$tgResources",
        "$routeParams",
        "$q",
        "$tgLocation",
        "$filter",
        "$log",
        "tgAppMetaService",
        "$tgNavUrls",
        "$tgAnalytics",
        "$translate",
        "tgErrorHandlingService",
        "tgProjectService",
        "tgAttachmentsFullService",
    ]

    constructor: (@scope, @rootscope, @repo, @model, @confirm, @rs, @params, @q, @location,
                  @filter, @log, @appMetaService, @navUrls, @analytics, @translate, @errorHandlingService, @projectService, @attachmentsFullService) ->
        @scope.$on("wiki:links:move", @.moveLink)
        @scope.$on("wikipage:add", @.loadWiki)
        @scope.projectSlug = @params.pslug
        @scope.wikiSlug = @params.slug
        @scope.sectionName = "Wiki"
        @scope.linksVisible = false
        @scope.attachmentsReady = false
        @scope.$on "attachments:loaded", () =>
            @scope.attachmentsReady = true

        promise = @.loadInitialData()

        # On Success
        promise.then () => @._setMeta()

        # On Error
        promise.then null, @.onInitialDataError.bind(@)

    _setMeta: ->
        title =  @translate.instant("WIKI.PAGE_TITLE", {
            wikiPageName: @scope.wikiSlug
            projectName: @scope.project.name
        })
        description =  @translate.instant("WIKI.PAGE_DESCRIPTION", {
            wikiPageContent: angular.element(@scope.wiki?.html or "").text()
            totalEditions: @scope.wiki?.editions or 0
            lastModifiedDate: moment(@scope.wiki?.modified_date).format(@translate.instant("WIKI.DATETIME"))
        })

        @appMetaService.setAll(title, description)

    loadAttachments: ->
        @attachmentsFullService.loadAttachments('wikipage', @scope.wikiId, @scope.projectId)

    loadProject: ->
        project = @projectService.project.toJS()

        if not project.is_wiki_activated
            @errorHandlingService.permissionDenied()

        @scope.projectId = project.id
        @scope.project = project
        @scope.$emit('project:loaded', project)
        return project

    loadWiki: =>
        promise = @rs.wiki.getBySlug(@scope.projectId, @params.slug)
        promise.then (wiki) =>
            @scope.wiki = wiki
            @scope.wikiId = wiki.id

            @.loadAttachments()

            return @scope.wiki

        promise.then null, (xhr) =>
            @scope.wikiId = null
            @scope.attachmentsReady = true

            if @scope.project.my_permissions.indexOf("add_wiki_page") == -1
                return null

            if @scope.project.archived_code
                return null

            data = {
                project: @scope.projectId
                slug: @scope.wikiSlug
                content: ""
            }
            @scope.wiki = @model.make_model("wiki", data)
            return @scope.wiki

    loadWikiLinks: ->
        return @rs.wiki.listLinks(@scope.projectId).then (wikiLinks) =>
            @scope.wikiLinks = wikiLinks

            for link in @scope.wikiLinks
                link.url = @navUrls.resolve("project-wiki-page", {
                    project: @scope.projectSlug
                    slug: link.href
                })

            selectedWikiLink = _.find(wikiLinks, {href: @scope.wikiSlug})

    loadInitialData: ->
        project = @.loadProject()

        @.fillUsersAndRoles(project.members, project.roles)
        @q.all([@.loadWikiLinks(), @.loadWiki()]).then @.checkLinksPerms.bind(this)

    checkLinksPerms: ->
        if @scope.project.my_permissions.indexOf("add_wiki_link") != -1 ||
          (@scope.project.my_permissions.indexOf("view_wiki_links") != -1 && @scope.wikiLinks.length)
            @scope.linksVisible = true

    delete: ->
        title = @translate.instant("WIKI.DELETE_LIGHTBOX_TITLE")
        message = @scope.wikiSlug

        @confirm.askOnDelete(title, message).then (askResponse) =>
            onSuccess = =>
                askResponse.finish()
                ctx = {project: @scope.projectSlug}
                @location.path(@navUrls.resolve("project-wiki", ctx))
                @confirm.notify("success")
                @.loadWiki()

            onError = =>
                askResponse.finish(false)
                @confirm.notify("error")

            @repo.remove(@scope.wiki).then onSuccess, onError

    moveLink: (ctx, item, itemIndex) =>
        values = @scope.wikiLinks
        r = values.indexOf(item)
        values.splice(r, 1)
        values.splice(itemIndex, 0, item)
        _.each values, (value, index) ->
            value.order = index

        @repo.saveAll(values)

module.controller("WikiDetailController", WikiDetailController)


