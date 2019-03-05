function PatternEditor(obj, binding) {

    let originalPattern = obj.get(binding);

    let updatePattern = function (action, nodeName) {

        let sep = {Select: ':', And: ':&', Not: ':!'};

        let p = obj.get(binding);

        if (action !== 'Select' && p === '') AlertBox.status('warning', 'Select host or group first');

        else p ? obj.set(binding, p + sep[action] + nodeName) : obj.set(binding, nodeName)

    };

    let $dialog = Modal.notification(false, Templates['pattern-form']);

    $dialog.find('input.pattern-input').attr('data-bind', binding);

    $dialog.find('button.clear-button').click(() => obj.set(binding, ''));

    $dialog.find('button.reload-button').click(() => obj.set(binding, originalPattern));

    obj.bindElement($dialog);

    [Host.prototype.type, Group.prototype.type].forEach(function (type) {

        $dialog.find('div.' + type + '-grid').DynaGrid({
            showFilter: true,
            minHeight: 300,
            maxHeight: 300,
            gridBodyTopMargin: 10,
            itemToggle: false,
            truncateItemText: true,
            gridBodyClasses: 'inset-container scrollbar',
            columns: sessionStorage.getItem('selection_modal_columns'),
            ajaxUrl: Entities[type].href,
            formatItem: function($gridContainer, $gridItem, data) {

                let nodeName = data.attributes.name;

                let $dropdownMenu = Templates['pattern-dropdown'];

                $dropdownMenu.find('span.dropdown-toggle').html(nodeName);

                $dropdownMenu.find('span.dropdown-item').click(function () {

                    updatePattern(this.textContent, nodeName)

                });

                $gridItem.html($dropdownMenu)

            },

        });

    });

    $dialog.dialog({width: 700})

}

