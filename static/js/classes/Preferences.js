function Preferences(param) {

    Battuta.call(this, param);

    return this;

}

Preferences.prototype = Object.create(Battuta.prototype);

Preferences.prototype.constructor = Preferences;

Preferences.prototype.links = {self: '/preferences'};

Preferences.prototype.loadParam = function (param) {

    let self = this;

    self.set('items', []);

    self.set('groups', []);

    if (param.data) for (let i = 0; i < param.data.length; i++) {

        self.items.push({
            name: param.data[i]['id'],
            description: param.data[i]['attributes']['description'],
            default: param.data[i]['attributes']['default'],
            stored: param.data[i]['attributes']['stored'],
            dataType: param.data[i]['attributes']['data_type'],
            group: param.data[i]['attributes']['group'],
        })

    }

    if (param.include) for (let j = 0; j < param.include.length; j++) {

        self.groups.push({
            id: param.include[j]['id'],
            name: param.include[j]['attributes']['name'],
            description: param.include[j]['attributes']['description'],
        })

    }

};

Preferences.prototype.load = function () {

    let self = this;

    return self.fetchJson('GET', self.links.self).then(response => {

        self.loadParam(response);


        for (let i = 0; i < self.items.length; i++) {

            let value = self.items[i].stored ? self.items[i].stored : self.items[i].default;

            sessionStorage.setItem(self.items[i]['name'], value)

        }

    });

};

Preferences.prototype.dialog = function () {

    let self = this;

    let $element;

    let $dialog = self.confirmationDialog().dialog({autoOpen: false, width: 800});

    $dialog.find('.dialog-header').append(
        'Preferences',
        $('<button>').attr({class: 'restore-button btn btn-sm btn-icon float-right', title:'Restore defaults'}).append(
            $('<span>').attr('class', 'fas fa-fw fa-undo-alt')
        )
    );

    $dialog.find('button.restore-button').click(function () {

        self.warningAlert('Restore all preferences to default values?', function () {

            $dialog.find('.item-input').each(function (index, input) {

                $(input).val($(input).data('default').toString())

            });

            self.statusAlert('success', 'Preferences restored')

        })

    });

    $dialog.find('button.cancel-button').click(function () {

        $dialog.dialog('close');

    });

    $dialog.find('button.confirm-button').click(function () {

        let data = [];

        let noError = true;

        let validatePreference = (dataType, dataValue) => {

            if (dataType === 'number' && isNaN(dataValue)) return [false, 'Value must be a number'];

            else return [true, null];

        };

        $dialog.find('.item-input').each(function () {

            let result = validatePreference($(this).data('dataType'), $(this).val());

            if (result[0]) {

                data.push({
                    id: $(this).data('name'),
                    type: 'preference_item',
                    attributes: {value: $(this).val()}
                })

            }

            else {

                $('#' + $(this).data('name') + '_error').html(result[1]);

                noError = false;

            }

        });

        if (noError) {

            self.fetchJson('PATCH', self.links.self, {data: data}, true).then(() => {

                $dialog.dialog('close');

                new NavBar().build();

                Router.check(window.location.hash.split('#')[1]);

            });

        }

    });

    let $dialogContent = $dialog.find('div.dialog-content')
        .attr('class', 'inset-container scrollbar')
        .css('max-height', window.innerHeight * 0.5 + 'px');

    self.fetchHtml('templates_Preferences.html').then($templates => {

        $element = $templates;

        return self.fetchJson('GET', self.links.self)

    }).then(response => {

        self.loadParam(response);

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

        $dialogContent.empty();

        for (let i = 0; i < self.groups.length; i++) {

            let $header = $element.find('div.header-template').clone();

            $header.find('h6').attr('title', self.groups[i].description).html(self.groups[i].name);

            $dialogContent.append($header);

            for (let j = 0; j < self.items.length; j++) if (self.items[j].group === self.groups[i].id) {

                let $itemContainer = $itemTemplate.clone();

                let itemValue = self.items[j].stored ? self.items[j].stored : self.items[j].default;

                $itemContainer.find('.item-label').html(self.items[j].name + ':').attr('title', self.items[i].description);

                $itemContainer.find('div.input_container').addClass(fieldType[self.items[j].dataType].class).append(
                    fieldType[self.items[j].dataType].template.clone()
                        .attr('id', 'item_' + self.items[j].name)
                        .data({name: self.items[j].name, dataType: self.items[j].dataType, default: self.items[j].default})
                        .val(itemValue.toString())
                );

                $itemContainer.find('.error_label').attr('id', self.items[j].name + '_error');

                $dialogContent.append($itemContainer);
            }

            $dialogContent.children().last().removeClass('mb-1').addClass('mb-4')

        }

        $dialog.dialog('open')

    });

};