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

class UserNotificationsController extends mixOf(taiga.Controller, taiga.PageMixin)
    @.$inject = [
        "$scope",
        "$tgConfirm",
        "$tgResources",
        "$tgAuth",
        "$tgConfig",
        "tgResources",
        "tgCurrentUserService",
        "$translate"
    ]

    constructor: (@scope, @confirm, @rs, @auth, @config, @resources, @currentUserService, @translate) ->
        @scope.sectionName = "USER_SETTINGS.NOTIFICATIONS.SECTION_NAME"
        @scope.user = @auth.getUser()
        promise = @.loadInitialData()
        promise.then null, @.onInitialDataError.bind(@)

        @.isSaas = @config.get("isSaas")
        @.onPremiseSubscribed = false
        @.loadPremise = false

    subscribed: ->
        @.loadPremise = true
        @resources.onPremise.subscribeOnPremiseNewsletter(
            {
                "email": @currentUserService.getUser().get('email'),
                "full_name": @currentUserService.getUser().get('full_name'),
                "origin_form": 'Newsletter sign-up settings'
            }
        ).then () =>
            text = @translate.instant("PROJECT.NEWSLETTER_OPENING.SAVED_PREFERENCE")

            @confirm.notify("success", "Your preferences have been save successfully")
            @.onPremiseSubscribed = true
            @.loadPremise = false
            @resources.user.getUserStorage('dont_ask_premise_newsletter')
                .then (storageState) =>
                    @resources.user.setUserStorage('dont_ask_premise_newsletter', true)
                .catch (storageError) =>
                    if storageError.status = 404
                        @resources.user.createUserStorage('dont_ask_premise_newsletter', false)

        .catch () =>
            @confirm.notify("light-error", "")
            @.loadPremise = false

    loadInitialData: ->
        return @rs.notifyPolicies.list().then (notifyPolicies) =>
            @scope.notifyPolicies = notifyPolicies
            return notifyPolicies

module.controller("UserNotificationsController", UserNotificationsController)
