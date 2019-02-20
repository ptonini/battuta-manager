function Runner() { return this; }

Runner.prototype = Object.create(Main.prototype);

Runner.prototype.constructor = Runner;


Runner.prototype.templates = 'templates_Runner.html';


Runner.prototype.view = function () {

    let self = this;

    let $container = $('section.container');

    Templates.load(self.templates).then(() => {

        $container.html(Templates['runner-viewer']);

        $container.find('#job_tabs').rememberTab();

        let playbook = new Playbook({links: {self: Entities['playbooks'].href}});

        //let task = new Task({links: {self: Entities['playbooks'].href}});

        playbook.buildSelector($container.find('div.playbook-selector-container'), $container.find('div.playbook-args-container'));

        // $container.find('#adhoc_table').DataTable({
        //     scrollY: (window.innerHeight - sessionStorage.getItem('tab_table_offset')).toString() + 'px',
        //     scrollCollapse: true,
        //     autoWidth: false,
        //     pageLength: 50,
        //     ajax: {
        //         url: self.paths.api.adhoc + 'list/?pattern=',
        //         dataSrc: 'task_list'
        //     },
        //     columns: [
        //         {title: 'hosts', data: 'hosts', width: '20%'},
        //         {title: 'module', data: 'module', width: '15%'},
        //         {title: 'arguments', data: 'arguments', width: '45%'},
        //         {title: 'sudo', data: 'become', width: '10%'},
        //         {title: '', defaultContent: '', width: '10%', class: 'float-right', orderable: false}
        //     ],
        //     paging: false,
        //     dom: 'Bfrtip',
        //     buttons: [
        //         {
        //             text: '<span class="fas fa-plus fa-fw" title="Create task"></span>',
        //             className: 'btn-sm btn-icon',
        //             action: function () {
        //
        //                 new AdHocTask().dialog(function () {
        //
        //                     $('#adhoc_table').DataTable().ajax.reload()
        //
        //                 });
        //
        //             }
        //         }
        //     ],
        //     rowCallback: function (row, data) {
        //
        //         let adhoc = new AdHocTask(data);
        //
        //         $(row).find('td:eq(2)').html(adhoc.argumentsToString()).attr('title', adhoc.argumentsToString());
        //
        //         $(row).find('td:eq(3)').prettyBoolean();
        //
        //         $(row).find('td:eq(4)').empty().append(
        //             // self.tableBtn('fas fa-cogs', 'Run', function () {
        //             //
        //             //     new Job(adhoc).run();
        //             //
        //             // }),
        //             self.tableBtn('fas fa-pencil-alt', 'Edit', function () {
        //
        //                 adhoc.dialog(function () {
        //
        //                     $('#adhoc_table').DataTable().ajax.reload()
        //
        //                 });
        //
        //             }),
        //             self.tableBtn('fas fa-clone', 'Copy', function () {
        //
        //                 adhoc.id = '';
        //
        //                 adhoc.save(function () {
        //
        //                     $('#adhoc_table').DataTable().ajax.reload()
        //
        //                 })
        //
        //             }),
        //             self.tableBtn('fas fa-trash', 'Delete', function () {
        //
        //                 adhoc.del(function () {
        //
        //                     $('#adhoc_table').DataTable().ajax.reload()
        //
        //                 });
        //             })
        //         )
        //     }
        //
        // });

})

};

