function Base () {}

Base.prototype = {

    _requestResponse: function (data, callback, failCallback) {

        switch (data.status) {

            case 'ok':

                callback && callback(data);

                data.msg && $.bootstrapGrowl(data.msg, {type: 'success'});

                break;

            case 'failed':

                failCallback && failCallback(data);

                data.msg && $.bootstrapGrowl(submitErrorAlert.clone().append(data.msg), failedAlertOptions);

                break;

            case 'denied':

                $.bootstrapGrowl('Permission denied', failedAlertOptions);

                break;

            default:

                $.bootstrapGrowl('Unknown response', failedAlertOptions)

        }

    },

    _submitRequest: function (type, object, url, callback, failCallback) {

        var self = this;

        var requestData = {};

        for (var property in object) {

            if (object.hasOwnProperty(property)) requestData[property] = object[property];
        }

        $.ajax({
            url: url,
            type: type,
            dataType: 'json',
            data: requestData,
            success: function (data) {

                self._requestResponse(data, callback, failCallback)

            }
        });

    },

    _getData: function (action, callback, failCallback) {

        var self = this;

        self._submitRequest('GET', self, self.apiPath + action + '/', callback, failCallback);

    },

    _postData: function (action, callback, failCallback) {

        var self = this;

        self._submitRequest('POST', self, self.apiPath + action + '/', callback, failCallback);

    },

    delete: function (callback) {

        var self = this;

        var deleteDialog = smallDialog.clone().addClass('text-center').append(
            $('<strong>').html('This action cannot be undone')
        );

        deleteDialog
            .dialog({
                width: '320',
                buttons: {
                    Delete: function () {

                        self._postData('delete', function (data) {

                            callback && callback(data)

                        });

                        $(this).dialog('close');

                    },
                    Cancel: function () {

                        $(this).dialog('close')

                    }
                },

                close: function() {

                    $(this).remove()

                }

            })
            .dialog('open')

    }

};

