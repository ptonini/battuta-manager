function Preferences(param) {

    let self = this;

    self.set('items', []);

    self.set('groups', []);

    if (param && param.data) for (let i = 0; i < param.data.length; i++) {

        self.items.push({
            name: param.data[i]['id'],
            description: param.data[i]['attributes']['description'],
            default: param.data[i]['attributes']['default'],
            stored: param.data[i]['attributes']['stored'],
            dataType: param.data[i]['attributes']['data_type'],
            group: param.data[i]['attributes']['group'],
        })

    }

    if (param && param.include) for (let j = 0; j < param.include.length; j++) {

        self.groups.push({
            id: param.include[j]['id'],
            name: param.include[j]['attributes']['name'],
            description: param.include[j]['attributes']['description'],
        })

    }

    return this;
}

Preferences.prototype = Object.create(BaseModel.prototype);

Preferences.prototype.constructor = Preferences;


Preferences.prototype.links = {self: '/preferences/'};


Preferences.prototype.load = function () {

    let self = this;

    return self.read(false).then(response => {

        self.constructor(response);

        for (let i = 0; i < self.items.length; i++) {

            let value = self.items[i].stored ? self.items[i].stored : self.items[i].default;

            sessionStorage.setItem(self.items[i]['name'], value)

        }

    });

};

Preferences.prototype.openModal = function () {

    let self = this;

    let $form = Templates['form'];

    let $restoreButton = Templates['restore-button'].click(() => {

        AlertBox.warning('Restore all preferences to default values?', function () {

            modal.element.find('.item-input').each(function (index, input) {

                $(input).val($(input).data('default').toString())

            });

            AlertBox.status('success', 'Preferences restored')

        })

    });

    let modal = new ModalBox('Preferences', $form);

    modal.onConfirmation = () => {

        let data = [];

        let noError = true;

        let validatePreference = (dataType, dataValue) => {

            if (dataType === 'number' && isNaN(dataValue)) return [false, 'Value must be a number'];

            else return [true, null];

        };

        $form.find('.item-input').each(function () {

            let result = validatePreference($(this).data('dataType'), $(this).val());

            if (result[0]) data.push({
                id: $(this).data('name'),
                type: 'preference_item',
                attributes: {value: $(this).val()}
            });

            else {

                $('#' + $(this).data('name') + '_error').html(result[1]);

                noError = false;

            }

        });

        noError && fetchJson('PATCH', self.links.self, {data: data}, true).then(() => location.reload());

    };

    modal.header.append($restoreButton);

    modal.content.addClass('inset-container scrollbar').css('max-height', window.innerHeight * 0.5 + 'px');

    return self.read(false).then(response => {

        self.constructor(response);

        $form.empty();

        for (let i = 0; i < self.groups.length; i++) {

            let $header = Templates['prefs-header'];

            $header.find('h6').attr('title', self.groups[i].description).html(self.groups[i].name);

            $form.append($header);

            for (let j = 0; j < self.items.length; j++) if (self.items[j].group === self.groups[i].id) {

                let $itemContainer = Templates['prefs-item-row'];

                let $inputContainer = Templates['prefs-input-' + self.items[j].dataType];

                let itemValue = self.items[j].stored ? self.items[j].stored : self.items[j].default;

                $inputContainer.find('.item-input')
                    .attr('id', 'item_' + self.items[j].name)
                    .data({name: self.items[j].name, dataType: self.items[j].dataType, default: self.items[j].default})
                    .val(itemValue.toString());

                $itemContainer
                    .find('div.item-label').html(self.items[j].name + ':').attr('title', self.items[i].description)
                    .after($inputContainer);

                $itemContainer.find('.error_label').attr('id', self.items[j].name + '_error');

                $form.append($itemContainer);
            }

            $form.children().last().removeClass('mb-1').addClass('mb-4')

        }

        modal.open({width: 800})

    });

};