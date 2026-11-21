###
# This source code is licensed under the terms of the
# GNU Affero General Public License found in the LICENSE file in
# the root directory of this source tree.
#
# Copyright (c) 2021-present Kaleidos INC
###

taiga = @.taiga
bindOnce = @.taiga.bindOnce

module = angular.module("taigaCommon")


#############################################################################
## Date Range Directive (used mainly for sprint date range)
#############################################################################

DateRangeDirective = ($translate) ->
    renderRange = ($el, first, second) ->
        prettyDate = $translate.instant("BACKLOG.SPRINTS.DATE")
        startDate = moment(first).format(prettyDate)
        endDate = moment(second).format(prettyDate)
        $el.html(
            $translate.instant("TASKBOARD.TITLE_DATE_RANGE", { startDate: startDate, endDate: endDate})
        )

    link = ($scope, $el, $attrs) ->
        [first, second] = $attrs.tgDateRange.split(",")

        bindOnce $scope, first, (valFirst) ->
            bindOnce $scope, second, (valSecond) ->
                renderRange($el, valFirst, valSecond)

    return {link:link}

module.directive("tgDateRange", ["$translate", DateRangeDirective])


#############################################################################
## Date Selector Directive (using pikaday)
#############################################################################

DateSelectorDirective = ($rootscope, datePickerConfigService) ->
    link = ($scope, $el, $attrs, $model) ->
        selectedDate = null

        initialize = () ->
            datePickerConfig = datePickerConfigService.get()

            _.merge(datePickerConfig, {
                field: $el[0]
            })

            $el.picker = new Pikaday(datePickerConfig)

        unbind = $rootscope.$on "$translateChangeEnd", (ctx) =>
            $el.picker.destroy() if $el.picker
            initialize()

        $attrs.$observe "pickerValue", (val) ->
            $el.val(val)

            if val?
                $el.picker.destroy() if $el.picker
                initialize()

            $el.picker.setDate(val)

        $scope.$on "$destroy", ->
            $el.off()
            unbind()
            $el.picker.destroy()

    return {
        link: link
    }

module.directive("tgDateSelector", ["$rootScope", "tgDatePickerConfigService", DateSelectorDirective])


#############################################################################
## Sprint Progress Bar Directive
#############################################################################

SprintProgressBarDirective = ->
    renderProgress = ($el, percentage, visual_percentage) ->
        if $el.hasClass(".current-progress")
            $el.css("width", "#{percentage}%")
        else
            $el.find(".current-progress").css("width", "#{visual_percentage}%")
            $el.find(".number").html("#{percentage} %")

    link = ($scope, $el, $attrs) ->
        bindOnce $scope, $attrs.tgSprintProgressbar, (sprint) ->
            closedPoints = sprint.closed_points
            totalPoints = sprint.total_points
            percentage = 0
            percentage = Math.round(100 * (closedPoints/totalPoints)) if totalPoints != 0
            visual_percentage = 0
            #Visual hack for .current-progress bar
            visual_percentage = Math.round(98 * (closedPoints/totalPoints)) if totalPoints != 0

            renderProgress($el, percentage, visual_percentage)

        $scope.$on "$destroy", ->
            $el.off()

    return {link: link}

module.directive("tgSprintProgressbar", SprintProgressBarDirective)


UserDisplayDirective = ($template, $compile, $translate, $navUrls, avatarService)->
    # Display the user information (full name and photo).
    #
    # Example:
    #     div.creator(tg-user-display, tg-user-id="{{ user.id }}")
    #
    # Requirements:
    #   - scope.usersById object is required.

    link = ($scope, $el, $attrs) ->
        id = $attrs.tgUserId
        $scope.user = $scope.usersById[id] or {
            full_name_display: $translate.instant("COMMON.EXTERNAL_USER")
        }

        avatar = avatarService.getAvatar($scope.usersById[id] or null)

        $scope.user.avatar = avatar.url
        $scope.user.bg = avatar.bg

        $scope.url = if $scope.user.is_active then $navUrls.resolve("user-profile", {username: $scope.user.username}) else ""

        $scope.$on "$destroy", ->
            $el.off()

    return {
        link: link
        restrict: "EA"
        scope: true,
        templateUrl: "common/components/user-display.html"
    }

module.directive("tgUserDisplay", ["$tgTemplate", "$compile", "$translate", "$tgNavUrls", "tgAvatarService",
                                   UserDisplayDirective])


#############################################################################
## Common list directives
#############################################################################
## NOTE: These directives are used in issues and search and are
##       completely bindonce, they only serves for visualization of data.
#############################################################################

ListItemEpicStatusDirective = ->
    link = ($scope, $el, $attrs) ->
        epic = $scope.$eval($attrs.tgListitemEpicStatus)
        bindOnce $scope, "epicStatusById", (epicStatusById) ->
            $el.text(epicStatusById[epic.status].name)

    return {link:link}

module.directive("tgListitemEpicStatus", ListItemEpicStatusDirective)

ListItemUsStatusDirective = ->
    link = ($scope, $el, $attrs) ->
        us = $scope.$eval($attrs.tgListitemUsStatus)
        bindOnce $scope, "usStatusById", (usStatusById) ->
            $el.text(usStatusById[us.status].name)

    return {link:link}

module.directive("tgListitemUsStatus", ListItemUsStatusDirective)


ListItemTaskStatusDirective = ->
    link = ($scope, $el, $attrs) ->
        task = $scope.$eval($attrs.tgListitemTaskStatus)
        bindOnce $scope, "taskStatusById", (taskStatusById) ->
            $el.text(taskStatusById[task.status].name)

    return {link:link}

module.directive("tgListitemTaskStatus", ListItemTaskStatusDirective)


ListItemAssignedtoDirective = ($template, $translate, avatarService) ->
    template = $template.get("common/components/list-item-assigned-to-avatar.html", true)

    link = ($scope, $el, $attrs) ->
        bindOnce $scope, "usersById", (usersById) ->
            item = $scope.$eval($attrs.tgListitemAssignedto)
            ctx = {
                name: $translate.instant("COMMON.ASSIGNED_TO.NOT_ASSIGNED"),
            }

            member = usersById[item.assigned_to]
            avatar = avatarService.getAvatar(member)

            ctx.imgurl = avatar.url
            ctx.bg = avatar.bg

            if member
                ctx.name = member.full_name_display

            $el.html(template(ctx))

    return {link:link}

module.directive("tgListitemAssignedto", ["$tgTemplate", "$translate", "tgAvatarService", ListItemAssignedtoDirective])


ListItemIssueStatusDirective = ->
    link = ($scope, $el, $attrs) ->
        issue = $scope.$eval($attrs.tgListitemIssueStatus)
        bindOnce $scope, "issueStatusById", (issueStatusById) ->
            $el.text(issueStatusById[issue.status].name)

    return {link:link}

module.directive("tgListitemIssueStatus", ListItemIssueStatusDirective)


ListItemTypeDirective = ->
    link = ($scope, $el, $attrs) ->
        render = (issueTypeById, issue) ->
            type = issueTypeById[issue.type]
            domNode = $el.find(".level")
            domNode.css("background-color", type.color)
            domNode.attr("title", type.name)

        bindOnce $scope, "issueTypeById", (issueTypeById) ->
            issue = $scope.$eval($attrs.tgListitemType)
            render(issueTypeById, issue)

        $scope.$watch $attrs.tgListitemType, (issue) ->
            render($scope.issueTypeById, issue)

    return {
        link: link
        templateUrl: "common/components/level.html"
    }

module.directive("tgListitemType", ListItemTypeDirective)


ListItemPriorityDirective = ->
    link = ($scope, $el, $attrs) ->
        render = (priorityById, issue) ->
            priority = priorityById[issue.priority]
            domNode = $el.find(".level")
            domNode.css("background-color", priority.color)
            domNode.attr("title", priority.name)

        bindOnce $scope, "priorityById", (priorityById) ->
            issue = $scope.$eval($attrs.tgListitemPriority)
            render(priorityById, issue)

        $scope.$watch $attrs.tgListitemPriority, (issue) ->
            render($scope.priorityById, issue)

    return {
        link: link
        templateUrl: "common/components/level.html"
    }

module.directive("tgListitemPriority", ListItemPriorityDirective)


ListItemSeverityDirective = ->
    link = ($scope, $el, $attrs) ->
        render = (severityById, issue) ->
            severity = severityById[issue.severity]
            domNode = $el.find(".level")
            domNode.css("background-color", severity.color)
            domNode.attr("title", severity.name)

        bindOnce $scope, "severityById", (severityById) ->
            issue = $scope.$eval($attrs.tgListitemSeverity)
            render(severityById, issue)

        $scope.$watch $attrs.tgListitemSeverity, (issue) ->
            render($scope.severityById, issue)

    return {
        link: link
        templateUrl: "common/components/level.html"
    }

module.directive("tgListitemSeverity", ListItemSeverityDirective)


#############################################################################
## Progress bar directive
#############################################################################

TgProgressBarDirective = ($template) ->
    template = $template.get("common/components/progress-bar.html", true)

    render = (el, percentage) ->
        el.html(template({percentage: percentage}))

    link = ($scope, $el, $attrs) ->
        element = angular.element($el)

        $scope.$watch $attrs.tgProgressBar, (percentage) ->
            percentage = _.max([0 , percentage])
            percentage = _.min([100, percentage])
            render($el, percentage)

        $scope.$on "$destroy", ->
            $el.off()

    return {link: link}

module.directive("tgProgressBar", ["$tgTemplate", TgProgressBarDirective])


#############################################################################
## Main title directive
#############################################################################

TgMainTitleDirective = ($translate) ->
    link = ($scope, $el, $attrs) ->
        $attrs.$observe "i18nSectionName", (i18nSectionName) ->
            $scope.sectionName = i18nSectionName

        $scope.$on "$destroy", ->
            $el.off()

    return {
        link: link
        templateUrl: "common/components/main-title.html"
    }

module.directive("tgMainTitle", ["$translate",  TgMainTitleDirective])
