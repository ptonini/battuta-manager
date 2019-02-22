function Playbook (param) {

    FileObj.call(this, param);

    // this.selectorTableOptions.buttons = function (self) {
    //
    //     let buttons  = FileObj.prototype.selectorTableOptions.buttons(self);
    //
    //     buttons[0]['action'] = function () {
    //
    //         let playbook = new Playbook({links: {parent: self.links.self}, type: 'file'});
    //
    //         playbook.nameEditor('create', function (response) {
    //
    //             response.data.type === 'file' &&  playbook.constructor(response.data).contentEditor()
    //
    //         })
    //
    //     };
    //
    //     return buttons
    //
    // };

    return this;

}

Playbook.prototype = Object.create(FileObj.prototype);

Playbook.prototype.constructor = Playbook;


Playbook.prototype.label = {single: 'playbook', plural: 'playbooks'};

Playbook.prototype.selectorTableOptions = {
    buttons: function (self) {

        let buttons  = FileObj.prototype.selectorTableOptions.buttons(self);

        buttons[0]['action'] = function () {

            let playbook = new Playbook({links: {parent: self.links.self}, type: 'file'});

            playbook.nameEditor('create', function (response) {

                response.data.type === 'file' &&  playbook.constructor(response.data).contentEditor()

            })

        };

        return buttons

    },
    rowCallback: FileObj.prototype.selectorTableOptions.rowCallback
};


Playbook.prototype.buildSelector = function ($selectorContainer, $argsContainer) {

    let self = this;

    let $playbookSelector = $selectorContainer.find('select.playbook-selector');

    self.read(true, {list: true}).then(result => {

        for (let i = 0; i < result.data.length; i++) {

            $playbookSelector.append(
                $('<option>').data(result.data[i]).attr('value', result.data[i].attributes.path).html(result.data[i].attributes.path)
            );

        }

        $playbookSelector.change(function () {

            let playbook = new Playbook($(this).find(':selected').data());

            let args = new PlaybookArgs({attributes: {path: playbook.path}, links: {self: playbook.links.args}});

            $selectorContainer.find('button.edit-playbook-button').off().click(function () {

                Templates.load(FileObj.prototype.templates).then(() => playbook.edit());

            });

            args.selector($argsContainer);

        }).change();

    });

};

// Playbook.prototype.form = function ($container, args) {
//
//     let self = this;
//
//     let user = new User({username: sessionStorage.getItem('user_name')});
//
//     return self.fetchHtml('templates_PlaybookArgs.html', $container).then($element => {
//
//         self.bindElement($element);
//
//         self.patternEditor($element.find('#pattern_field_group'), 'args.subset');
//
//         user.credentialsSelector(null, true, $element.find('#credentials_selector'));
//
//         $element.find('#play_args_selector')
//             .on('build', function () {
//
//                 let $argsSelector = $(this);
//
//                 self.fetchJson('GET', self.paths.api.playbook + 'getArgs/', self).then(data => {
//

//
//                 })
//
//             })
//             .on('change', function () {
//
//                 let $selectedOption = $('option:selected', $(this));
//
//                 self.set('args', $selectedOption.data());
//
//                 sessionStorage.setItem('currentArgs', JSON.stringify(self.get('args')));
//
//                 $element.find('button.delete-button').prop('disabled', $selectedOption.val() === 'new');
//
//             })
//             .trigger('build');

//         $element.find('button.run-button').click(function () {
//
//             self.fetchJson('GET', self.paths.api.file + 'read/', self).then(data => {
//
//                 if (data.status === 'ok' ) {
//
//                     if (self.validator.playbooks(data.text)) return jsyaml.load(data.text);
//
//                 }
//
//                 else {
//
//                     self.statusAlert('danger', data.msg);
//
//                     return Promise.reject();
//
//                 }
//
//
//             }).then(data => {
//
//                 let job = new Job(self);
//
//                 $.each(data, function (index, play) {
//
//                     let trueValues = ['true','True','TRUE','yes','Yes','YES','y','Y','on','On','ON'];
//
//                     (trueValues.indexOf(play.become) > -1 || trueValues.indexOf(play.sudo) > -1) && job.set('become', true);
//
//                 });
//
//                 job.set('type', 'playbook');
//
//                 job.set('subset', self.args.subset || '');
//
//                 job.set('tags', self.args.tags || '');
//
//                 job.set('skip_tags', self.args.skip_tags || '');
//
//                 job.set('extra_vars', self.args.extra_vars || '');
//
//                 job.set('cred', $element.find('#credentials_selector option[value="'+ self.cred + '"]').data());
//
//                 job.run();
//
//             });
//
//         });

//         $element.find('button.save-button').click(function () {
//
//             if (!(!self.args.subset && !self.args.tags && !self.args.skip_tags && !self.args.extra_vars)) self.postArgs('saveArgs');
//
//             else self.statusAlert('warning', 'Cannot save empty form');
//
//         });
//
//         $element.find('button.delete-button').click(function () {
//
//             self.deleteAlert(function () {
//
//                 self.postArgs('delArgs')
//
//             })
//
//         });

//         $element.find('button.close-button').hide();
//
//         $element.find('input').keypress(function (event) {
//
//             event.keyCode === 13 && $element.find('button.run-button').click()
//
//         });
//
//     });
//
// };

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
