function Runner() {

    let playbooks = new Playbook({links: {self: Entities['playbooks'].href}});

    let tasks = new AdHocTask();

    Templates.load('templates_Runner.html').then(() => {

        let $runner = Templates['runner-viewer'];

        $(mainContainer).html($runner);

        document.title = 'Battuta - Runner';

        $runner.find('#job_tabs').rememberTab();

        playbooks.selectorField($runner.find('div.playbook-selector-container'), $runner.find('div.playbook-args-container'));

        tasks.selector($runner.find('div.task-table-container'));

        setCanvasHeight($runner);

    })

}

