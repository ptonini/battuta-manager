function InventoryManager() {

    let self = this;

    Templates.load('templates_InventoryManager.html').then(() => {

        let $manager = Templates['inventory-manager'];

        $(mainContainer).html($manager);

        document.title = 'Battuta - Inventory manager';

        $manager.find('#manage_inventory_tabs').rememberTab();

        $manager.find('#upload_field')
            .fileinput({
                ajaxSettings: {method: 'PATCH', beforeSend: ajaxBeforeSend, error: self.ajaxError},
                mergeAjaxCallbacks: 'before',
                uploadUrl: Entities.manage.href,
                uploadExtraData: function () {

                    return {format: $('input[type="radio"][name="import_file_type"]:checked').val()}

                },
                uploadAsync: true
            })
            .on('fileuploaded', function (event, data) {

                $manager.find('#upload_field').fileinput('clear').fileinput('enable');

                $manager.find('#upload_field_title').html('Select file');

                $manager.find('#import_button').prop('disabled', true);

                $manager.find('div.file-caption-main').show();

                self.ajaxSuccess(data.response, function() {

                    AlertBox.status('success', $('<div>').append(
                        $('<div>').attr('class','mb-2 font-weight-bold').html('Import successful'),
                        $('<div>').attr('class','mb-1').html('Hosts added: ' + data.response.data.added_hosts),
                        $('<div>').attr('class','mb-1').html('Groups added: ' + data.response.data.added_groups),
                        $('<div>').attr('class','mb-1').html('Variables added: ' + data.response.data.added_vars)
                    ));

                });

            })
            .on('fileloaded', function () {

                $manager.find('#import_button')
                    .prop('disabled', false)
                    .off('click')
                    .click(function () {

                        $manager.find('#upload_field').fileinput('upload');

                        $manager.find('div.file-caption-main').hide()

                    });

            });

        $manager.find('#export_button').click(function () {

            let format = $('input[type="radio"][name="export_file_type"]:checked').val();

            if (format === 'filezilla') {

                let $form = Templates['sftp-user-form'];

                let modal = new ModalBox(false, $form);

                modal.onConfirmation = () => {

                    let sftpUSer = $form.find('input.sftp-user-input').val();

                    if (sftpUSer) {

                        window.open(Entities.manage.href + '?format=' + format + '&sftp_user=' + sftpUSer, '_self');

                        modal.close()

                    }

                    else AlertBox.status('warning', 'Enter default user');

                };

                modal.open();

            } else window.open(Entities.manage.href + '?format=' + format, '_self');

        });

        setCanvasHeight($manager);

    });

}

