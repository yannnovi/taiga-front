###
# This source code is licensed under the terms of the
# GNU Affero General Public License found in the LICENSE file in
# the root directory of this source tree.
#
# Copyright (c) 2021-present Kaleidos INC
###

taiga = @.taiga
mixOf = @.taiga.mixOf
sizeFormat = @.taiga.sizeFormat
module = angular.module("taigaUserSettings")

#############################################################################
## User settings Controller
#############################################################################

class UserSettingsController extends mixOf(taiga.Controller, taiga.PageMixin)
    @.$inject = [
        "$scope",
        "$tgConfig",
        "$tgRepo",
        "$tgResources",
        "$routeParams",
        "$q",
        "$tgLocation",
        "$tgNavUrls",
        "$tgAuth",
        "$translate",
        "tgErrorHandlingService"
    ]

    constructor: (@scope, @config, @repo, @rs, @params, @q, @location, @navUrls,
                  @auth, @translate, @errorHandlingService) ->
        @scope.sectionName = "USER_SETTINGS.MENU.SECTION_TITLE"

        @scope.project = {}
        @scope.user = @auth.getUser()

        if !@scope.user
            @errorHandlingService.permissionDenied()
        else
            @scope.lang = @getLan()
            @scope.theme = @getTheme()

        maxFileSize = @config.get("maxUploadFileSize", null)
        if maxFileSize
            text = @translate.instant("USER_SETTINGS.AVATAR_MAX_SIZE", {"maxFileSize": sizeFormat(maxFileSize)})
            @scope.maxFileSizeMsg = text

        promise = @.loadInitialData()

        promise.then null, @.onInitialDataError.bind(@)

    loadInitialData: ->
        compiledThemes = window._taigaAvailableThemes
        @scope.availableThemes = @config.get("themes", []).filter (theme) =>
            return compiledThemes.includes(theme)

        return @rs.locales.list().then (locales) =>
            @scope.locales = locales
            return locales

    getLan: ->
        return @scope.user.lang ||
               @translate.preferredLanguage()

    getTheme: ->
        compiledThemes = window._taigaAvailableThemes

        theme = @scope.user.theme ||
               @config.get("defaultTheme") ||
               "taiga"

        if !compiledThemes.includes(theme)
            theme = "taiga"

        return theme


module.controller("UserSettingsController", UserSettingsController)


