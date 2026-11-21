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
## User Web Notifications Controller
#############################################################################

class UserWebNotificationsController extends mixOf(taiga.Controller, taiga.PageMixin)
    @.$inject = [
        "$scope",
        "$tgResources",
        "$tgAuth"
    ]

    constructor: (@scope, @rs, @auth) ->
        @scope.sectionName = "USER_SETTINGS.EVENTS.SECTION_NAME"
        @scope.user = @auth.getUser()
        promise = @.loadInitialData()
        promise.then null, @.onInitialDataError.bind(@)

    loadInitialData: ->
        return @rs.notifyPolicies.list().then (notifyPolicies) =>
            @scope.notifyPolicies = notifyPolicies
            return notifyPolicies

module.controller("UserWebNotificationsController", UserWebNotificationsController)
