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

    _submitRequest: function (type, obj, url, callback, failCallback) {

        var self = this;

        var data = {};

        var pathKeys = ['path', 'basePath','apiPath', 'baseApiPath'];

        for (var p in obj) {

            if (obj.hasOwnProperty(p) && pathKeys.indexOf(p) === -1) data[p] = obj[p];
        }

        $.ajax({
            url: url,
            type: type,
            dataType: 'json',
            data: data,
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

    _selectionDialog: function (options) {

        var selectionDialog = largeDialog.clone();

        selectionDialog
            .DynaGrid({
                gridTitle: 'selection',
                showFilter: true,
                showAddButton: (options.addButtonAction),
                addButtonClass: 'open_node_form',
                addButtonTitle: 'Add ' + options.objectType,
                maxHeight: 400,
                itemToggle: options.showButtons,
                truncateItemText: true,
                checkered: true,
                columns: sessionStorage.getItem('selection_modal_columns'),
                ajaxUrl: options.url,
                ajaxDataKey: options.ajaxDataKey,
                itemValueKey: options.itemValueKey,
                loadCallback: function (gridContainer) {

                    options.loadCallback && options.loadCallback(gridContainer, selectionDialog)

                },
                addButtonAction: function () {

                    options.addButtonAction && options.addButtonAction(selectionDialog)

                },
                formatItem: function(gridContainer, gridItem) {

                    options.formatItem && options.formatItem(gridItem, selectionDialog)

                }
            })
            .dialog({
                minWidth: 700,
                minHeight: 500,
                buttons: {
                    Cancel: function () {

                        $(this).dialog('close')

                    }
                },
                close: function() {

                    $(this).remove()

                }
            })
            .dialog('open');
    },

    deleteDialog: function (action, callback) {

    var self = this;

    var dialog = smallDialog.clone().addClass('text-center').append(
        $('<strong>').html('This action cannot be undone')
    );

    dialog
        .dialog({
            width: '320',
            buttons: {
                Delete: function () {

                    self._postData(action, function (data) {

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

},

    delete: function (callback) {

        var self = this;

        self.deleteDialog('delete', callback)

    },

    edit: function (callback) {

        var self = this;

        var header = self.name ? 'Edit ' + self.name : 'Add ' + self.type;

        var nameFieldInput = textInputField.clone().val(self.name);

        var descriptionField = textAreaField.clone().val(self.description);

        var dialog = largeDialog.clone().append(
            $('<h4>').html(header),
            divRow.clone().append(
                divCol12.clone().append(
                    divFormGroup.clone().append($('<label>').html('Name').append(nameFieldInput))
                ),
                divCol12.clone().append(
                    divFormGroup.clone().append($('<label>').html('Description').append(descriptionField))
                )
            )
        );

        dialog
            .dialog({
                buttons: {
                    Save: function() {

                        self.name = nameFieldInput .val();

                        self.description = descriptionField.val();

                        self._postData('save', function (data) {

                            dialog.dialog('close');

                            callback && callback(data);

                        })

                    },
                    Cancel: function() {

                        $(this).dialog('close');

                    }
                },
                close: function() {

                    $(this).remove()

                }
            })
            .dialog('open');

        },

    get: function (callback) {

        var self = this;

        self._getData('get', function (data){

            data[self.key] && self.constructor(data[self.key]);

            callback && callback(data)

        })

    }

};

