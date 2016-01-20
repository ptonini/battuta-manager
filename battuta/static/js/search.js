function filterEntities(type, dataSet, searchPattern) {
    $.ajax({
        url: '/inventory/get/' + type + 's/',
        type: 'GET',
        dataType: 'JSON',
        async: false,
        success: function (data) {
            $.each(data, function (index, value) {
                if (value[0].indexOf(searchPattern) >= 0) {
                    dataSet.push([type, value[0], value[1]])
                }
            });
        }
    });
}

$(document).ready(function () {

    var searchResults = $('#search_results');
    var searchPattern = searchResults.children('h4').children('span').html();
    var dataSet = [];
    var url;
    filterEntities('group', dataSet, searchPattern);
    filterEntities('host', dataSet, searchPattern);

    searchResults.children('ul').html('');
    $.each(dataSet, function (index, value) {
        url = '/inventory/' + value[0] + '/' + value[2];
        if ( dataSet.length == 1 ) {
            window.open(url, '_self')
        }
        $('#' + value[0] + '_results').append(
            $('<li>').attr('class', 'list-group-item').append(
                $('<a>').attr('href', url).append(value[1])
            )
        );
    });

    searchResults.children('ul').each(function () {
        var result = adjustList($(this).children('li').length, 1, 5, 5);
        var listColumns = result[0];
        var listPadding = result[1];

        $(this).css({'-webkit-columns': listColumns.toString()});

        //Add padding
        addListPadding($(this), listPadding);
    });

});