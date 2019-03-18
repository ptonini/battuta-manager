function Playbook (param) {

    FileObj.call(this, param);

}

Playbook.buildFromPath = function (path) {

    return new Playbook({links: {self: '/files/playbooks/' + path}})

};

Playbook.prototype = Object.create(FileObj.prototype);

Playbook.prototype.constructor = Playbook;


Playbook.prototype.label = {single: 'playbook', collective: 'playbooks'};

Playbook.prototype.addCallback = function () {

    let self = this;

    self.type === 'file' && self.read(false, {fields: {attributes: ['name', 'content']}}).then(() => self.contentEditor());

};

Playbook.prototype.parse = function () {

    let self = this;

    return self.read(false, {fields: {attributes: ['content']}}).then(() => {

        return YAML.parse(self.content)

    });

};


Playbook.prototype.selectorField = function ($selectorContainer, $argsContainer) {

    let self = this;

    let selectorField = $selectorContainer.find('select.playbook-selector');

    self.read(true, {list: true}).then(result => {

        for (let i = 0; i < result.data.length; i++) selectorField.append(
            $('<option>')
                .data(result.data[i])
                .attr('value', result.data[i].attributes.path)
                .html(result.data[i].attributes.path)
        );

        selectorField.change(function () {

            let playbook = new Playbook($(this).find(':selected').data());

            let args = new PlaybookArgs({attributes: {path: playbook.path}, links: {self: playbook.links.args}});

            $selectorContainer.find('button.playbook-edit-button').off().click(function () {

                Templates.load(FileObj.prototype.templates).then(() => playbook.edit());

            });

            args.selector($argsContainer, playbook);

        }).change();

    });

};

// Playbook.prototype.dialog = function (args) {
//
//     let self = this;
//
//     let $dialog = Templates['dialog'];
//
//     $dialog.find('h5.dialog-header').html(self.name);
//
//     $dialog.find('div.dialog-footer').remove();
//
//     self.form($dialog.find('div.dialog-content'), args).then(() => {
//
//         $dialog.find('#play_args_selector_container').remove();
//
//         $dialog.find('button.save-button').remove();
//
//         $dialog.find('button.delete-button').remove();
//
//         $dialog.find('button.close-button').show().click(function () {
//
//             $dialog.dialog('close');
//
//         });
//
//         $dialog.dialog({width: 480})
//
//     })
//
// };
//
// Playbook.prototype.postArgs = function (action) {
//
//     let self = this;
//
//     self.ajaxRequest('POST', self, self.paths.api.playbook + action + '/', true, data => {
//
//         $('#play_args_selector').trigger('build', data);
//
//     })
//
// };
