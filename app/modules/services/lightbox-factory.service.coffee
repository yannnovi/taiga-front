###
# This source code is licensed under the terms of the
# GNU Affero General Public License found in the LICENSE file in
# the root directory of this source tree.
#
# Copyright (c) 2021-present Kaleidos INC
###

class LightboxFactory
    @.$inject = ["$rootScope", "$compile"]
    constructor: (@rootScope, @compile) ->

    create: (name, attrs, scopeAttrs) ->
        scope = @rootScope.$new()

        scope = _.merge(scope, scopeAttrs)

        # Built as `<name>` (the directive's own tag), not a `<div>` carrying `name` as an
        # attribute: downgraded Angular components (`@angular/upgrade`'s `downgradeComponent`)
        # always compile with `restrict: 'E'`, so an attribute-only match silently mounts
        # nothing. Plain AngularJS directives default to `restrict: 'EA'`, so they still match
        # the same as before; none of this factory's callers restrict to `'A'` only.
        elm = $("<#{name}>")
            .attr("tg-bind-scope", true)

        if attrs
            elm.attr(attrs)

        elm.addClass("remove-on-close")

        html = @compile(elm)(scope)

        $(document.body).append(html)

        return

angular.module("taigaCommon").service("tgLightboxFactory", LightboxFactory)
