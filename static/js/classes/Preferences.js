function Preferences(param) {

    Battuta.call(this, param);

}

Preferences.prototype = Object.create(Battuta.prototype);

Preferences.prototype.constructor = Preferences;

Preferences.prototype.key = 'prefs';

Preferences.prototype.apiPath = Battuta.prototype.paths.api.preferences;

Preferences.prototype.loadParam = function (param) {

    let self = this;

    self.set('default', param.default);

    self.set('stored', param.stored ? param.stored : {});

    self.set('user', param.user ? param.user : {});

};

Preferences.prototype.load = function () {

    let self = this;

    return self.fetchJson('GET', self.apiPath).then(response => {

        self.loadParam(response.data);

        sessionStorage.setItem('user_name', self.user.name);

        sessionStorage.setItem('user_id', self.user.id);

        sessionStorage.setItem('timezone', self.user.tz);

        $.each(self.default, function (i) {

            $.each(self.default[i].items, function (j, item) {

                sessionStorage.setItem(item.name, item.value)

            })

        });

        Object.keys(self.stored).forEach(function (key) {

            sessionStorage.setItem(key, self.stored[key])

        });


    });




};

Preferences.prototype.dialog = function () {

    let self = this;

    self.fetchHtml('templates_Preferences.html').then($element => {

        let $dialog = self.confirmationDialog().dialog({autoOpen: false, width: 800});

        $dialog.find('.dialog-header').append(
            'Preferences',
            $('<button>').attr({class: 'restore-button btn btn-sm btn-icon float-right', title:'Restore defaults'}).append(
                $('<span>').attr('class', 'fas fa-fw fa-undo-alt')
            )
        );

        $dialog.find('button.restore-button').click(function () {

            self.warningAlert('Restore all preferences to default values?', function () {

                $.each(self.default, function (i) {

                    $.each(self.default[i].items, function (j, item) {

                        $('#item_' + item.name).val(item.value.toString());

                    })

                });

                self.statusAlert('success', 'Preferences restored')

            })

        });

        $dialog.find('button.cancel-button').click(function () {

            $dialog.dialog('close');

        });

        $dialog.find('button.confirm-button').click(function () {

            let prefs = {};

            let noError = true;

            let validatePreference = (dataType, dataValue) => {

                if (dataType === 'number' && isNaN(dataValue)) return [false, 'Value must be a number'];

                else return [true, null];

            };

            $dialogContent.find('input,select').each(function () {

                let result = validatePreference($(this).data('data_type'), $(this).val());

                if (result[0]) prefs[$(this).data('name')] = $(this).val();

                else {

                    $('#' + $(this).data('name') + '_error').html(result[1]);

                    noError = false;

                }

            });

            if (noError) {

                self.prefs = prefs;

                self.save(function () {

                    setTimeout(function () {

                        location.reload()

                    }, 1000)

                });

            }

        });

        let $dialogContent = $dialog.find('div.dialog-content')
            .attr('class', 'inset-container scrollbar')
            .css('max-height', window.innerHeight * 0.5 + 'px');

        let $itemTemplate = $element.find('div.item-template').removeClass('item-template');

        let fieldType = {
            str: {
                class: 'col-5',
                template: $element.find('input.input-template').clone().removeClass('input-template')
            },
            bool: {
                class: 'col-2',
                template: $element.find('select.input-template').clone().removeClass('input-template')
            },
            number: {
                class: 'col-2',
                template: $element.find('input.input-template').clone().removeClass('input-template')
            }

        };

        let defaultValues;

        self.refresh(false, function () {

            defaultValues = [];

            $dialogContent.empty();

            $.each(self.default, function (index, item_group) {

                let $header = $element.find('div.header-template').clone();

                $header.find('h6').attr('title', item_group.description).html(item_group.name);

                $dialogContent.append($header);

                $.each(item_group.items, function (index, item) {

                    let $itemContainer = $itemTemplate.clone();

                    $itemContainer.find('.item-label').html(item.name + ':');

                    $itemContainer.find('div.input_container').addClass(fieldType[item.data_type].class).append(
                        fieldType[item.data_type].template.clone()
                            .attr({id: 'item_' + item.name})
                            .data({name: item.name, data_type: item.data_type})
                            .val(item.value.toString())
                    );

                    $itemContainer.find('.error_label').attr('id', item.name + '_error');

                    $dialogContent.append($itemContainer);

                    defaultValues.push([item.name, item.value]);

                });

                $dialogContent.children().last().removeClass('mb-1').addClass('mb-4')

            });

            Object.keys(self.stored).forEach(function (key) {

                $dialogContent.find('#item_' + key).val(self.stored[key].toString());

            });

            $dialog.dialog('open')

        });

    });

};