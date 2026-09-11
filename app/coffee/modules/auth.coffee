###
# This source code is licensed under the terms of the
# GNU Affero General Public License found in the LICENSE file in
# the root directory of this source tree.
#
# Copyright (c) 2021-present Kaleidos INC
###

taiga = @.taiga

module = angular.module("taigaAuth", ["taigaResources"])

class LoginPage
    @.$inject = [
        'tgCurrentUserService',
        '$location',
        '$tgNavUrls',
        '$routeParams',
        '$tgAuth'
    ]

    constructor: (currentUserService, $location, $navUrls, $routeParams, $auth) ->
        if currentUserService.isAuthenticated()
            if not $routeParams['force_login']
                url = $navUrls.resolve("home")
                if $routeParams['next']
                    url = decodeURIComponent($routeParams['next'])
                    $location.search('next', null)

                if $routeParams['unauthorized']
                    $auth.clear()
                    $auth.removeToken()
                else
                    $location.url(url)


module.controller('LoginPage', LoginPage)

#############################################################################
## Authentication Service
#############################################################################

class AuthService extends taiga.Service
    @.$inject = ["$rootScope",
                 "$tgStorage",
                 "$tgModel",
                 "$tgResources",
                 "$tgHttp",
                 "$tgUrls",
                 "$tgConfig",
                 "$tgUserPilot",
                 "$translate",
                 "tgCurrentUserService",
                 "tgThemeService",
                 "$tgAnalytics"]

    constructor: (@rootscope, @storage, @model, @rs, @http, @urls, @config, @userpilot, @translate, @currentUserService,
                  @themeService, @analytics) ->
        super()

        userModel = @.getUser()
        @._currentTheme = @._getUserTheme()

        @.setUserdata(userModel)

    setUserdata: (userModel) ->
        if userModel
            @.userData = Immutable.fromJS(userModel.getAttrs())
            @currentUserService.setUser(@.userData)
        else
            @.userData = null
        @analytics.setUserId()

    _getUserTheme: ->
        compiledThemes = window._taigaAvailableThemes
        defaultTheme = @config.get("defaultTheme") || "taiga"

        if !_.includes(@config.get("themes"), @rootscope.user?.theme) || !compiledThemes.includes(@rootscope.user?.theme)
            return defaultTheme

        return @rootscope.user?.theme

    _setTheme: ->
        newTheme = @._getUserTheme()

        if @._currentTheme != newTheme
            @._currentTheme = newTheme
            @themeService.use(@._currentTheme)

    _setLocales: ->
        lang = @rootscope.user?.lang || @config.get("defaultLanguage") || "en"
        @translate.preferredLanguage(lang)  # Needed for calls to the api in the correct language
        @translate.use(lang)                # Needed for change the interface in runtime

    getUser: ->
        if @rootscope.user
            return @rootscope.user

        userData = @storage.get("userInfo")

        if userData
            user = @model.make_model("users", userData)
            @rootscope.user = user
            @._setLocales()

            @._setTheme()

            return user
        else
            @._setTheme()

        return null

    setUser: (user) ->
        @rootscope.auth = user
        @storage.set("userInfo", user.getAttrs())
        @rootscope.user = user

        @.setUserdata(user)

        @._setLocales()
        @._setTheme()

    clear: ->
        @rootscope.auth = null
        @rootscope.user = null
        @storage.remove("userInfo")

    setRefreshToken: (token) ->
        @storage.set("refresh", token)

    getRefreshToken: ->
        return @storage.get("refresh")

    setToken: (token) ->
        @storage.set("token", token)

    getToken: ->
        return @storage.get("token")

    removeToken: ->
        @storage.remove("token")
        @storage.remove("refresh")

    isAuthenticated: ->
        if @.getUser() != null
            return true
        return false

    ## Http interface
    refresh: () ->
        url = @urls.resolve("user-me")

        return @http.get(url).then (data, status) =>
            user = data.data
            user.token = @.getUser().auth_token

            user = @model.make_model("users", user)

            @.setUser(user)
            @rootscope.$broadcast("auth:refresh", user)
            return user

    login: (data, type) ->
        url = @urls.resolve("auth")

        data = _.clone(data, false)
        data.type = if type then type else "normal"

        @.removeToken()

        return @http.post(url, data).then (data, status) =>
            user = @model.make_model("users", data.data)
            @.setToken(user.auth_token)
            @.setRefreshToken(user.refresh)
            @.setUser(user)
            @rootscope.$broadcast("auth:login", user)
            return user

    logout: ->
        @.removeToken()
        @.clear()
        @currentUserService.removeUser()

        @._setTheme()
        @._setLocales()
        @rootscope.$broadcast("auth:logout")
        @analytics.setUserId()

    register: (data, type, existing) ->
        url = @urls.resolve("auth-register")

        data = _.clone(data, false)
        data.type = if type then type else "public"
        if type == "private"
            data.existing = if existing then existing else false

        @.removeToken()

        return @http.post(url, data).then (response) =>
            user = @model.make_model("users", response.data)
            @.setToken(user.auth_token)
            @.setUser(user)
            @rootscope.$broadcast("auth:register", user)
            return user

    getInvitation: (token) ->
        return @rs.invitations.get(token)

    acceptInvitiationWithNewUser: (data) ->
        return @.register(data, "private", false)

    forgotPassword: (data) ->
        url = @urls.resolve("users-password-recovery")
        data = _.clone(data, false)
        @.removeToken()
        return @http.post(url, data)

    changePasswordFromRecovery: (data) ->
        url = @urls.resolve("users-change-password-from-recovery")
        data = _.clone(data, false)
        @.removeToken()
        return @http.post(url, data)

    changeEmail: (data) ->
        url = @urls.resolve("users-change-email")
        data = _.clone(data, false)
        return @http.post(url, data)

    cancelAccount: (data) ->
        url = @urls.resolve("users-cancel-account")
        data = _.clone(data, false)
        return @http.post(url, data)

    exportProfile: () ->
        url = @urls.resolve("users-export")
        return @http.post(url)

    sendVerificationEmail: () ->
        url = @urls.resolve("user-send-verification-email")
        return @http.post(url)

module.service("$tgAuth", AuthService)


#############################################################################
## Auth Plugin Slot
#############################################################################
# Small bridge kept in AngularJS on purpose: contrib plugins of type "auth" (external,
# not bundled in this repo - see `$rootScope.authPlugins`, set once in app.coffee) supply
# an arbitrary `plugin.template` name meant for `ng-include`, compiled dynamically against
# AngularJS's `$compile`. Angular has no equivalent for compiling a runtime-provided
# template string, so this directive is the one surviving `ng-include` host for it - just
# component-like enough (a real `template`) for `UpgradeComponent` to wrap
# (`TgAuthPluginSlotUpgradedDirective`, src/app/upgraded/), unlike `tgAvatarBig`
# (see MIGRATION.md, sous-projet 4g) which had none. Used by every new Angular
# login/register form (src/app/login-form/, register-form/, invitation/) wherever the
# original had a `.contrib-plugins-wrapper`.

AuthPluginSlotDirective = () ->
    return {
        restrict: "E"
        scope: {
            plugin: "="
        }
        template: '<div ng-include="plugin.template"></div>'
    }

module.directive("tgAuthPluginSlot", [AuthPluginSlotDirective])
