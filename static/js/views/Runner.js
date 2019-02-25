function Runner() {

    let playbooks = new Playbook({links: {self: Entities['playbooks'].href}});

    let tasks = new AdHocTask();

    $(mainContainer).off().empty();

    Templates.load('templates_Runner.html').then(() => {

        $(mainContainer).html(Templates['runner-viewer']);

        $(mainContainer).find('#job_tabs').rememberTab();

        playbooks.selectorField($(mainContainer).find('div.playbook-selector-container'), $(mainContainer).find('div.playbook-args-container'));

        tasks.selector($(mainContainer).find('div.task-table-container'))

    })

}

