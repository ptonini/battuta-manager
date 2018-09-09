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

    self.fetchHtml('manageInventory.html', $('#content_container')).then($element => {

        self.bind($element);

        $element.find('#manage_inventory_tabs').rememberTab();

        $('#upload_field')
            .fileinput({
                uploadUrl: self.apiPath + 'import/',
                uploadExtraData: function () {

                    return {
                        format: $('input[type="radio"][name="import_file_type"]:checked').val(),
                        csrfmiddlewaretoken: self.getCookie('csrftoken')
                    }

                },
                uploadAsync: true
            })
            .on('fileuploaded', function (event, data) {

                $('#upload_field').fileinput('clear').fileinput('enable');

                $('#upload_field_title').html('Select file');

                $('#import_button').prop('disabled', true);

                $element.find('div.file-caption-main').show();

                self.requestResponse(data.response, function() {

                    self.fetchHtml('importResult.html').then($element => {

                        $element.find('#host_count').html(data.response.added_hosts);

                        $element.find('#group_count').html(data.response.added_groups);

                        $element.find('#var_count').html(data.response.added_vars);

                        $.bootstrapGrowl($element, {type: 'success', delay: 0});

                    });

                });

            })
            .on('fileloaded', function () {

                $('#import_button')
                    .prop('disabled', false)
                    .off('click')
                    .click(function () {

                        $('#upload_field').fileinput('upload');

                        $('#upload_field_title').html('Uploading file');

                        $element.find('div.file-caption-main').hide()

                    });

            });

        $('#export_button').click(function () {

            let format = $('input[type="radio"][name="export_file_type"]:checked').val();

            if (format === 'filezilla') {

                self.fetchHtml('filezillaExportDialog.html').then($element => {

                    self.bind($element);

                    $element
                        .dialog({
                            buttons: {
                                Export: function () {

                                    if (self.sftp_user) {

                                        window.open(self.apiPath + 'export/?format=' + format + '&sftp_user=' + self.sftp_user, '_self');

                                        $(this).dialog('close')

                                    }

                                    else $.bootstrapGrowl('Enter default user', {type: 'warning'});
                                },
                                Cancel: function() {

                                    $(this).dialog('close')

                                }
                            }
                        })

                })

            }

            else window.open(self.apiPath + 'export/?format=' + format, '_self');

        });

    });

};
