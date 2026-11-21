###
# This source code is licensed under the terms of the
# GNU Affero General Public License found in the LICENSE file in
# the root directory of this source tree.
#
# Copyright (c) 2021-present Kaleidos INC
###

taiga = @.taiga

module = angular.module("taigaCommon")

#############################################################################
## jQuery plugin for Popover
#############################################################################

$.fn.popover = () ->
    $el = @

    isVisible = () =>
        $el.css({
            "display": "block",
            "visibility": "hidden"
        })

        docViewTop = $(window).scrollTop()
        docViewBottom = docViewTop + $(window).height()

        docViewWidth = $(window).width()
        docViewRight = docViewWidth
        docViewLeft = 0

        elemTop = $el.offset().top
        elemBottom = elemTop + $el.height()

        elemWidth = $el.width()
        elemLeft = $el.offset().left
        elemRight = $el.offset().left + elemWidth

        $el.css({
            "display": "none",
            "visibility": "visible"
        })

        return ((elemBottom <= docViewBottom) && (elemTop >= docViewTop) && (elemLeft >= docViewLeft) && (elemRight <= docViewRight))

    closePopover = (onClose) =>
        if onClose then onClose.call($el)

        $el.fadeOut () =>
            $el
                .removeClass("active")
                .removeClass("fix")

        $el.off("popup:close")


    closeAll = () =>
        $(".popover.active").each () ->
            $(this).trigger("popup:close")

    open = (onClose) =>
        if $el.hasClass("active")
            close()
        else
            closeAll()

            if !isVisible()
                $el.addClass("fix")

            $el.fadeIn () =>
                $el.addClass("active")
                $(document.body).off("popover")

                $(document.body).one "click.popover", () =>
                    closeAll()

            $el.on "popup:close", (e) => closePopover(onClose)

    close = () =>
        $el.trigger("popup:close")

    return {open: open, close: close, closeAll: closeAll}

# Example:
#
# taiga.globalPopover(el, [
#     {
#         text: 'Button text',
#         event: () ->
#             console.log('button clicked')
#     }
# ], {
#     width: 170,
#     paddingTop: 10,
#     paddingLeft: 5
# }, () -> onClosePopover())

taiga.globalPopover = (target, list, options = {}, cb) ->
    wrapper = document.createElement('div')
    wrapper.classList.add('popover', 'global-popover')
    ul = document.createElement('ul')

    createSvg = (icon) ->
        tgSvg = document.createElement('tg-svg')
        svg = document.createElement('svg')
        use = document.createElement('use')

        xlink = document.createAttribute('xlink:href')
        xlink.value = '#' + icon

        attrHref = document.createAttribute('attr-href')
        attrHref.value = '#' + icon

        use.setAttributeNode(xlink)
        use.setAttributeNode(attrHref)

        svg.classList.add('icon')
        svg.appendChild(use)
        tgSvg.appendChild(svg)

        return tgSvg

    close = () ->
        $(wrapper).popover().close()
        $(wrapper).remove()

    followElement = () ->
        elementPosition()
        requestAnimationFrame(followElement)

    elementPosition = () ->
        rect = target.getBoundingClientRect()
        top = rect.top + rect.height
        width = options.width || 170
        left = rect.right - width

        if options.paddingTop
            top = top + options.paddingTop

        if options.paddingLeft
            left = left + options.paddingLeft

        wrapper.style.top = top + 'px'
        wrapper.style.left = left + 'px'
        wrapper.style.width = width + 'px'

    elementPosition()
    followElement()

    document.addEventListener('scroll', close, true)

    list.forEach (option) ->
        li = document.createElement('li')
        button = document.createElement('button')
        button.addEventListener('click', option.event)

        if option.icon
            button.innerHTML = createSvg(option.icon).innerHTML

        button.appendChild(document.createTextNode(option.text))
        li.appendChild(button)
        ul.appendChild(li)

    wrapper.appendChild(ul)
    document.body.appendChild(wrapper)

    $(wrapper).popover().open () ->
        document.removeEventListener('scroll', close)

        cb()

        if wrapper
            setTimeout () ->
                $(wrapper).remove()
            , 2000

    return () =>
        $(wrapper).popover().close()
