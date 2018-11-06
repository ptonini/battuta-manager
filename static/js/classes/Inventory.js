function Inventory(param) {

    Battuta.call(this, param);

}

Inventory.prototype = Object.create(Battuta.prototype);

Inventory.prototype.constructor = Inventory;

Inventory.prototype.apiPath = Battuta.prototype.paths.api.inventory;

Inventory.prototype.loadParam = function (param) {

    let self = this;

    Object.keys(param).forEach(function (key) {

        self.set(key, param[key])

    });

};

Inventory.prototype.manage = function () {

    let self = this;

    self.fetchHtml('view_InventoryManager.html', $('section.container')).then($element => {

        self.bindElement($element);

        $element.find('#manage_inventory_tabs').rememberTab();

        $('#upload_field')
            .fileinput({
                ajaxSettings: {method: 'PUT', beforeSend: self.ajaxBeforeSend, error: self.ajaxError},
                mergeAjaxCallbacks: 'before',
                uploadUrl: self.apiPath,
                uploadExtraData: function () {

                    return {format: $('input[type="radio"][name="import_file_type"]:checked').val()}

                },
                uploadAsync: true
            })
            .on('fileuploaded', function (event, data) {

                $('#upload_field').fileinput('clear').fileinput('enable');

                $('#upload_field_title').html('Select file');

                $('#import_button').prop('disabled', true);

                $element.find('div.file-caption-main').show();

                self.ajaxSuccess(data.response, function() {

                    let $result = $('<div>').append(
                        $('<div>').attr('class','mb-2 font-weight-bold').html('Import successful'),
                        $('<div>').attr('class','mb-1').html('Hosts added: ' + data.response.added_hosts),
                        $('<div>').attr('class','mb-1').html('Groups added: ' + data.response.added_groups),
                        $('<div>').attr('class','mb-1').html('Variables added: ' + data.response.added_vars)
                    );

                    self.statusAlert('success', $result);

                });

            })
            .on('fileloaded', function () {

                $('#import_button')
                    .prop('disabled', false)
                    .off('click')
                    .click(function () {

                        $element.find('#upload_field').fileinput('upload');

                        $element.find('div.file-caption-main').hide()

                    });

            });

        $('#export_button').click(function () {

            let format = $('input[type="radio"][name="export_file_type"]:checked').val();

            if (format === 'filezilla') {

                let $dialog = self.confirmationDialog();

                $dialog.find('.dialog-header').remove();

                $dialog.find('div.dialog-content').append(
                    $('<label>').attr('for', 'input-sftp-user').html('SFTP default user'),
                    $('<input>').attr({id: 'input-sftp-user', 'data-bind': 'sftp_user', class: 'form-control form-control-sm', type: 'text', })
                );

                $dialog.find('button.cancel-button').click(function () {

                    $dialog.dialog('close');

                });

                $dialog.find('button.confirm-button').click(function () {

                    if (self.sftp_user) {

                        window.open(self.apiPath + '?format=' + format + '&sftp_user=' + self.sftp_user, '_self');

                        $dialog.dialog('close')

                    }

                    else self.statusAlert('warning', 'Enter default user');

                });

                self.bindElement($dialog);

                $dialog.dialog()

            }

            else window.open(self.apiPath + '?format=' + format, '_self');

        });

    });

};
