###
# This source code is licensed under the terms of the
# GNU Affero General Public License found in the LICENSE file in
# the root directory of this source tree.
#
# Copyright (c) 2021-present Kaleidos INC
###

taiga = @.taiga
mixOf = @.taiga.mixOf
bindOnce = @.taiga.bindOnce

module = angular.module("taigaUserSettings")


#############################################################################
## User settings Controller
#############################################################################

class UserLiveNotificationsController extends mixOf(taiga.Controller, taiga.PageMixin)
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
        "$tgAuth",
        "tgErrorHandlingService"
    ]

    constructor: (@scope, @rootscope, @repo, @confirm, @rs, @params, @q, @location, @navUrls, @auth, @errorHandlingService) ->
        @scope.sectionName = "USER_SETTINGS.NOTIFICATIONS.LIVE_SECTION_NAME"
        @scope.user = @auth.getUser()
        promise = @.loadInitialData()
        promise.then null, @.onInitialDataError.bind(@)

    loadInitialData: ->
        return @rs.notifyPolicies.list().then (notifyPolicies) =>
            @scope.notifyPolicies = notifyPolicies
            return notifyPolicies

module.controller("UserLiveNotificationsController", UserLiveNotificationsController)
