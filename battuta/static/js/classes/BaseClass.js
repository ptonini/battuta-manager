function Base (apiPath) {

    var self = this;

    self.apiPath = apiPath;

}


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

    _postData : function (action, callback, failCallback) {

        var self = this;

        self._submitRequest('POST', self, self.apiPath + action + '/', callback, failCallback);

    }

};

