function Inventory(param) {

    param = param ? param : {};

    var self = this;

    self.pubSub = $({});

    self.bindings = {};

    Object.keys(param).forEach(function (key) {

        self.set(key, param[key])

    });

}

Inventory.prototype = Object.create(Battuta.prototype);

Inventory.prototype.constructor = Inventory;

Inventory.prototype.apiPath = Battuta.prototype.paths.apis.inventory;

Inventory.prototype.manage = function () {

    var self = this;

    return $('<div>').load(self.paths.templates + 'manageInventory.html', function () {

        var $container = $(this);

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

                $container.find('div.file-caption-main').show();

                if (data.response.status === 'ok') {

                    $('<div>').load(self.paths.templates + 'importResult.html', function() {

                        $(this).find('#host_count').html(data.response.added_hosts);

                        $(this).find('#group_count').html(data.response.added_groups);

                        $(this).find('#var_count').html(data.response.added_vars);

                        $.bootstrapGrowl($(this), {type: 'success', delay: 0});

                    });

                }

                else if (data.response.result === 'denied') $.bootstrapGrowl('Permission denied', failedAlertOptions);

            })
            .on('fileloaded', function () {

                $('#import_button')
                    .prop('disabled', false)
                    .off('click')
                    .click(function () {

                        $('#upload_field').fileinput('upload');

                        $('#upload_field_title').html('Uploading file');

                        $container.find('div.file-caption-main').hide()

                    });

            });

        $('#export_button').click(function () {

            switch ($('input[type="radio"][name="export_file_type"]:checked').val()) {

                case 'json':

                    self.format = 'json';

                    self.getData('export', false, function (data) {

                        var jsonString = 'data:text/json;charset=utf-8,' + encodeURI(JSON.stringify(data, null, 4));

                        var link = document.createElement('a');

                        link.setAttribute('href', jsonString);

                        link.setAttribute('download', 'inventory.json');

                        document.body.appendChild(link);

                        link.click();

                        link.remove();

                    });

                    break;

                case 'zip':

                    window.open(self.apiPath + 'export/?format=zip', '_self');

                    break

            }

        });

    })

};
