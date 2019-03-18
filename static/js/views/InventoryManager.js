function InventoryManager() {

    Templates.load('templates_InventoryManager.html').then(() => {

        let $manager = Templates['inventory-manager'];

        let $uploadButton = $manager.find('button.upload-button').prop('disabled', true);

        $(mainContainer).html($manager);

        document.title = 'Battuta - Inventory manager';

        $manager.find('#manage_inventory_tabs').rememberTab();

        $manager.find('#upload_field')
            .fileinput({
                ajaxSettings: {method: 'PATCH', beforeSend: ajaxBeforeSend, error: ajaxError},
                uploadUrl: Entities.manage.href,
                uploadExtraData: function () {

                    return { format: $('input[type="radio"][name="import_file_type"]:checked').val() }

                },
                uploadAsync: true
            })
            .on('fileuploaded', function (event, data) {

                $manager.find('#upload_field').fileinput('clear').fileinput('enable');

                $manager.find('#upload_field_title').html('Select file');

                $uploadButton.prop('disabled', true);

                $manager.find('div.file-caption-main').show();

                ajaxSuccess(data.response, function() {

                    let $successMessage = Templates['import-results'];

                    $successMessage.find('span.host-count').html(data.response.data['added_hosts']);

                    $successMessage.find('span.group-count').html(data.response.data['added_groups']);

                    $successMessage.find('span.vars-count').html(data.response.data['added_vars']);

                    AlertBox.status('success', $successMessage);

                });

            })
            .on('fileloaded', function () {

                $uploadButton
                    .prop('disabled', false)
                    .off('click')
                    .click(function () {

                        $manager.find('#upload_field').fileinput('upload');

                        $manager.find('div.file-caption-main').hide()

                    });

            });

        $manager.find('button.download-button').click(function () {

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

