function Inventory(param) {

    param = param ? param : {};

    let self = this;

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

    let self = this;

    self.loadTemplate('manageInventory.html', $('#content_container')).then($element => {

        self.bind($element);

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

                    self.loadTemplate('importResult.html', $('<div>')).then($element => {

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

            switch ($('input[type="radio"][name="export_file_type"]:checked').val()) {

                case 'json':

                    self.format = 'json';

                    self.getData('export', false, function (data) {

                        let jsonString = 'data:text/json;charset=utf-8,' + encodeURI(JSON.stringify(data.inventory, null, 4));

                        let link = document.createElement('a');

                        link.setAttribute('href', jsonString);

                        link.setAttribute('download', 'inventory.json');

                        document.body.appendChild(link);

                        link.click();

                        link.remove();

                    });

                    break;

                case 'zip':

                    window.open(self.apiPath + 'export/?format=zip', '_self');

                    break;

            }

        });

    });

};
