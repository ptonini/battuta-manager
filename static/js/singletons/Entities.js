let Entities = {
    main: {
        Class: null,
        href: '/main',
        regex: /^main$/,
        action: function () { $('section.container').empty() }
    },
    search: {
        Class: null,
        href: '/search',
        regex: /^search\/?([-_a-zA-Z0-9]+)?/,
        action: function (param) { new Search(param[0]) }
    },
    manage: {
        Class: null,
        href: '/inventory/manage',
        regex: /^inventory\/manage$/,
        action: function () { new Inventory() }
    },
    hosts: {
        Class: Host,
        href: '/inventory/hosts',
        regex: /^inventory\/hosts\/?([0-9]+)?$/,
        action: function (param) { param[0] ? new Host({id: param[0], links: {self: param.input}}).viewer() : new Host().selector() }
    },
    groups: {
        Class: Group,
        href: '/inventory/groups',
        regex: /^inventory\/groups\/?([0-9]+)?$/,
        action: function (param) { param[0] ? new Group({id: param[0], links: {self: param.input}}).viewer() : new Group().selector() }
    },
    users: {
        href: '/iam/users',
        regex: /^iam\/users\/?([0-9]+)?$/,
        Class: User,
        action: function (param) { param[0] ? new User({id: param[0], links: {self: param.input}}).viewer() : new User().selector() }
    },
    usergroups: {
        href: '/iam/usergroups',
        regex: /^iam\/usergroups\/?([0-9]+)?$/,
        Class: UserGroup,
        action: function (param) { param[0] ? new UserGroup({id: param[0], links: {self: param.input}}).viewer() : new UserGroup().selector() }
    },
    projects: {
        href: '/projects/',
        regex: /^projects\/?([0-9]+)?$/,
        Class: Project,
        action: function (param) { param[0] ? new Project({id: param[0], links: {self: param.input}}).viewer() : new Project().selector() }
    },
    repository: {
        href: '/files/repository',
        regex: /^files\/repository\/?[\s\S]*$/,
        Class: FileObj,
        action: function (param) { new FileObj({links: {self: param.input}}).selector() }
    },
    playbooks: {
        href: '/files/playbooks',
        regex: /^files\/playbooks\/?[\s\S]*$/,
        Class: Playbook,
        action: function (param) { new Playbook({links: {self: param.input}}).selector() }
    },
    roles: {
        href: '/files/roles',
        regex: /^files\/roles\/?[\s\S]*$/,
        Class: Role,
        action: function (param) { new Role({links: {self: param.input}}).selector() }
    },
    runner: {
        href: '/runner/runner',
        regex: /^runner\/runner$/,
        Class: null,
        action: function () { new Runner().view() }
    },
};

for (let k in Entities) if (Entities.hasOwnProperty(k)) Router.add(Entities[k].regex, Entities[k].action);

Router.add(/[\s\S]*/, function () {

    $('section.container').empty();

    Main.prototype.statusAlert('warning', 'Page not found')

});