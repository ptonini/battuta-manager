(function () {
    var $;

    $ = jQuery;

    $.bootstrapGrowl = function (message, options) {
        var $alert, css, offsetAmount;

        options = $.extend({}, $.bootstrapGrowl.default_options, options);
        $alert = $("<div>");
        $alert.attr("class", "bootstrap-growl alert");
        if (options.type) {
            $alert.addClass("alert-" + options.type);
        }
        if (options.allow_dismiss) {
            $alert.attr('data-dismiss', 'alert')
        }
        $alert.append(message);
        if (options.top_offset) {
            options.offset = {
                from: "top",
                amount: options.top_offset
            };
        }
        if (options.offset.amount instanceof Function) offsetAmount = options.offset.amount();
        else offsetAmount = options.offset.amount;
        $(".bootstrap-growl").each(function () {
            return offsetAmount = Math.max(offsetAmount, parseInt($(this).css(options.offset.from)) + $(this).outerHeight() + options.stackup_spacing);
        });
        css = {
            "position": (options.ele === "body" ? "fixed" : "absolute"),
            "margin": 0,
            "z-index": "9999",
            "display": "none"
        };
        css[options.offset.from] = offsetAmount + "px";
        $alert.css(css);
        if (options.width !== "auto") {
            $alert.css("width", options.width + "px");
        }
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
        if (options.delay > 0) {
            return $alert.delay(options.delay).fadeOut(function () {
                options.close_callback();
                return $(this).remove();
            });
        }
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
        allow_dismiss: true,
        stackup_spacing: 10,
        close_callback: function() {}
    };

}).call(this);
