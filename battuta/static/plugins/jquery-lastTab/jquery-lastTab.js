/**
 * Created by ptonini on 29/09/17.
 */

(function ($) {

    $.fn.lastTab = function () {

        var keyName = $(this).attr('id') + '_activeTab';

        $(this).find('a[data-toggle="tab"]').on('show.bs.tab', function(event) {

            sessionStorage.setItem(keyName, $(event.target).attr('href'));

        });

        var activeTab = sessionStorage.getItem(keyName);

        activeTab && $(this).find('a[href="' + activeTab + '"]').tab('show');

    };


})(jQuery);
