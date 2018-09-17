(function ($) {

    $.bootstrapGrowl = function (message, options) {

        function _close($alert, options) {

            $alert.fadeOut(function () {

                options.closeCallback();

                return $(this).remove();

            });

        }

        options = $.extend({}, $.bootstrapGrowl.default_options, options);

        let $alert = $("<div>");

        let css = {
            "position": (options.ele === "body" ? "fixed" : "absolute"),
            "margin": 0,
            "z-index": "9999",
            "display": "none"
        };

        let offsetAmount;

        $alert.attr("class", "bootstrap-growl alert");

        if (options.type) $alert.addClass("alert-" + options.type);

        if (options.allowDismiss)$alert.attr('data-dismiss', 'alert');

        $alert.append(message);

        if (options.top_offset) options.offset = {
            from: "top",
            amount: options.top_offset
        };

        if (options.offset.amount instanceof Function) offsetAmount = options.offset.amount($alert);

        else offsetAmount = options.offset.amount;

        $(".bootstrap-growl").each(function () {

            return offsetAmount = Math.max(offsetAmount, parseInt($(this).css(options.offset.from)) + $(this).outerHeight() + options.stackupSpacing);

        });

        css[options.offset.from] = offsetAmount + "px";

        $alert.css(css);

        if (options.width !== "auto") $alert.css("width", options.width + "px");

        $(options.ele).append($alert);

        switch (options.align) {

            case "center":

                $alert.css({
                    "left": "50%",
                    "margin-left": "-" + ($alert.outerWidth() / 2) + "px"
                });

                break;

            case "left":

                $alert.css("left", "20px");

                break;

            default:

                $alert.css("right", "20px");

        }

        $alert.fadeIn();

        if (options.delay > 0) setTimeout(function () {

            _close($alert, options)

        }, options.delay);

        if (options.closeButton) options.closeButton.click(function () {

            _close($alert, options)

        });

        return $alert;

    };

    $.bootstrapGrowl.default_options = {
        ele: "body",
        type: null,
        offset: {
            from: "top",
            amount: 20
        },
        align: "right",
        width: 250,
        delay: 4000,
        allowDismiss: true,
        stackupSpacing: 10,
        closeCallback: function() {}
    };

})(jQuery);
