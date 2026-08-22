###
# This source code is licensed under the terms of the
# GNU Affero General Public License found in the LICENSE file in
# the root directory of this source tree.
#
# Copyright (c) 2021-present Kaleidos INC
###

module = angular.module("taigaCommon")

bindOnce = @.taiga.bindOnce
timeout = @.taiga.timeout
debounce = @.taiga.debounce
sizeFormat = @.taiga.sizeFormat
trim = @.taiga.trim
normalizeString = @.taiga.normalizeString

#############################################################################
## Common Lightbox Services
#############################################################################

# the lightboxContent hide/show doesn't have sense because is an IE hack
class LightboxService extends taiga.Service
    constructor: (@animationFrame, @q, @rootScope) ->

    open: ($el, onClose, onEsc, ignoreEsc) ->
        @.onClose = onClose

        if _.isString($el)
            $el = $($el)
        defered = @q.defer()

        lightboxContent = $el.children().not(".close")
        lightboxContent.hide()

        @animationFrame.add ->
            $el.css('display', 'flex')

        @animationFrame.add ->
            $el.addClass("open")
            $el.one "transitionend", =>
                firstField = $el.find('input:not(.no-focus),textarea:not(.no-focus)').first()

                if firstField.length
                    firstField.focus()
                else if document.activeElement
                    $(document.activeElement).blur()

        @animationFrame.add =>
            lightboxContent.show()
            defered.resolve()

        if !ignoreEsc
            docEl = angular.element(document)
            docEl.on "keydown.lightbox", (e) =>
                code = if e.keyCode then e.keyCode else e.which
                if code == 27
                    if onEsc
                        @rootScope.$applyAsync(onEsc)
                    else
                        @.close($el)


        @rootScope.$broadcast("lightbox:opened")
        return defered.promise

    close: ($el) ->
        return @q (resolve) =>
            if _.isString($el)
                $el = $($el)
            docEl = angular.element(document)
            docEl.off(".lightbox")
            docEl.off(".keyboard-navigation") # Hack: to fix problems in the WYSIWYG textareas when press ENTER

            $el.addClass('close-started') # don't attach animations

            @animationFrame.add =>
                $el.addClass('close')

                $el.one "transitionend", =>
                    $el.removeAttr('style')
                    $el
                        .removeClass("open")
                        .removeClass('close')
                        .removeClass('close-started')

                    if @.onClose
                        @rootScope.$apply(@.onClose)

                    resolve()

            if $el.hasClass("remove-on-close")
                scope = $el.data("scope")
                scope.$destroy() if scope
                $el.remove()

            @rootScope.$broadcast("lightbox:closed")


    getLightboxOpen: ->
        return $(".lightbox.open:not(.close-started)")

    closeAll: ->
        docEl = angular.element(document)
        for lightboxEl in docEl.find(".lightbox.open")
            @.close($(lightboxEl))


module.service("lightboxService", ["animationFrame", "$q", "$rootScope", LightboxService])


class LightboxKeyboardNavigationService extends taiga.Service
    stop: ->
        docEl = angular.element(document)
        docEl.off(".keyboard-navigation")

    dispatch: ($el, code) ->
        activeElement = $el.find(".selected")

        # Key: enter
        if code == 13
            if $el.find(".user-list-single").length == 1
                $el.find('.user-list-single:first').trigger("click")
            else
                activeElement.trigger("click")

        # Key: down
        else if code == 40
            if not activeElement.length
                $el.find('.user-list-single:not(".is-active"):first').addClass('selected')
            else
                next = activeElement.next('.user-list-single')
                if next.length
                    activeElement.removeClass('selected')
                    next.addClass('selected')
        # Key: up
        else if code == 38
            if not activeElement.length
                $el.find('.user-list-single:last').addClass('selected')
            else
                prev = activeElement.prev('.user-list-single:not(".is-active")')

                if prev.length
                    activeElement.removeClass('selected')
                    prev.addClass('selected')

    init: ($el) ->
        @stop()
        docEl = angular.element(document)
        docEl.on "keydown.keyboard-navigation", (event) =>
            code = if event.keyCode then event.keyCode else event.which
            if code == 40 || code == 38 || code == 13
                event.preventDefault()
                @.dispatch($el, code)

module.service("lightboxKeyboardNavigationService", LightboxKeyboardNavigationService)


#############################################################################
## Generic Lighthbox Directive
#############################################################################

# This adds generic behavior to all blocks with lightbox class like
# close button event handlers.

LightboxDirective = (lightboxService) ->
    link = ($scope, $el, $attrs) ->

        if !$attrs.$attr.visible
            $el.on "click", ".close", (event) ->
                event.preventDefault()
                lightboxService.close($el)

    return {restrict: "C", link: link}

module.directive("lightbox", ["lightboxService", LightboxDirective])


#############################################################################
## Lightbox Close Directive
#############################################################################

LightboxClose = () ->
    template = """
        <a class="close" ng-click="onClose()" href="" title="{{'COMMON.CLOSE' | translate}}">
            <tg-svg svg-icon="icon-close"></tg-svg>
        </a>
    """

    link = (scope, elm, attrs) ->

    return {
        scope: {
            onClose: '&'
        },
        link: link,
        template: template
    }

module.directive("tgLightboxClose", [LightboxClose])


#############################################################################
## Block Lightbox Directive
#############################################################################

# Issue/Userstory blocking message lightbox directive.

BlockLightboxDirective = ($rootscope, $tgrepo, $confirm, lightboxService, $loading, $modelTransform, $translate) ->
    link = ($scope, $el, $attrs, $model) ->
        title = $translate.instant($attrs.title)
        $el.find("h2.title").text(title)

        unblock = (finishCallback) =>
            transform = $modelTransform.save (item) ->
                item.is_blocked = false
                item.blocked_note = ""

                return item

            transform.then ->
                $confirm.notify("success")
                $rootscope.$broadcast("object:updated")
                finishCallback()

            transform.then null, ->
                $confirm.notify("error")
                item.revert()

            transform.finally ->
                finishCallback()

            return transform

        block = () ->
            currentLoading = $loading()
                .target($el.find(".js-block-item"))
                .start()

            transform = $modelTransform.save (item) ->
                item.is_blocked = true
                item.blocked_note = $el.find(".reason").val()

                return item

            transform.then ->
                $confirm.notify("success")
                $rootscope.$broadcast("object:updated")

            transform.then null, ->
                $confirm.notify("error")

            transform.finally ->
                currentLoading.finish()
                lightboxService.close($el)

        $scope.$on "block", ->
            $el.find(".reason").val($model.$modelValue.blocked_note)
            lightboxService.open($el)

        $scope.$on "unblock", (event, model, finishCallback) =>
            unblock(finishCallback)

        $scope.$on "$destroy", ->
            $el.off()

        $el.on "click", ".js-block-item", (event) ->
            event.preventDefault()

            block()

    return {
        templateUrl: "common/lightbox/lightbox-block.html"
        link: link
        require: "ngModel"
    }

module.directive("tgLbBlock", ["$rootScope", "$tgRepo", "$tgConfirm", "lightboxService", "$tgLoading", "$tgQueueModelTransformation", "$translate", BlockLightboxDirective])


LightboxLeaveProjectWarningDirective = (lightboxService, $template, $compile) ->
    link = ($scope, $el, attrs) ->
        lightboxService.open($el)

    return {
        templateUrl: 'common/lightbox/lightbox-leave-project-warning.html',
        link: link,
        scope: true
    }

module.directive("tgLightboxLeaveProjectWarning", ["lightboxService", LightboxLeaveProjectWarningDirective])


#############################################################################
## Set Due Date Lightbox Directive
#############################################################################

SetDueDateDirective = ($rootscope, lightboxService, $loading, $translate, $confirm, $modelTransform) ->
    link = ($scope, $el, attrs) ->
        prettyDate = $translate.instant("COMMON.PICKERDATE.FORMAT")
        lightboxService.open($el)

        if ($scope.object.due_date)
            $scope.new_due_date = moment($scope.object.due_date).format(prettyDate)

        $el.on "click", ".suggestion", (event) ->
            target = angular.element(event.currentTarget)
            quantity = target.data('quantity')
            unit = target.data('unit')
            value = moment().add(quantity, unit).format(prettyDate)
            $el.find(".due-date").val(value)

        save = ->
            currentLoading = $loading()
                .target($el.find(".submit-button"))
                .start()

            if $scope.notAutoSave
                new_due_date = $('.due-date').val()
                $scope.object.due_date = if (new_due_date) \
                    then moment(new_due_date, prettyDate).format("YYYY-MM-DD") \
                    else null

                $scope.$apply()
                currentLoading.finish()
                lightboxService.close($el)
                return

            transform = $modelTransform.save (object) ->
                new_due_date = $('.due-date').val()
                object.due_date = if (new_due_date) \
                    then moment(new_due_date, prettyDate).format("YYYY-MM-DD") \
                    else null
                return object

            transform.then ->
                $confirm.notify("success")

            transform.then null, ->
                $confirm.notify("error")

            transform.finally ->
                currentLoading.finish()
                lightboxService.close($el)
                $rootscope.$broadcast("object:updated")

        $el.on "click", ".submit-button", (event) ->
            event.preventDefault()
            save()

        remove = ->
            title = $translate.instant("LIGHTBOX.DELETE_DUE_DATE.TITLE")
            subtitle = $translate.instant("LIGHTBOX.DELETE_DUE_DATE.SUBTITLE")
            message = moment($scope.object.due_date).format(prettyDate)

            $confirm.askOnDelete(title, message, subtitle).then (askResponse) ->
                askResponse.finish()
                $('.due-date').val(null)
                $scope.object.due_date_reason = null
                if $scope.notAutoSave
                    $scope.object.due_date = null
                    lightboxService.close($el)
                else
                    save()

        $el.on "click", ".delete-due-date", (event) ->
            event.preventDefault()
            remove()

    return {
        templateUrl: 'common/lightbox/lightbox-due-date.html',
        link: link,
        scope: true
    }

module.directive("tgLbSetDueDate", ["$rootScope", "lightboxService", "$tgLoading", "$translate", "$tgConfirm"
                                    "$tgQueueModelTransformation", SetDueDateDirective])


