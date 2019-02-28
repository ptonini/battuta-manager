const Entities = {
    main: {
        Class: null,
        href: '/main',
        regex: /^main$/,
        action: () => $(mainContainer).off().empty()
    },
    search: {
        Class: null,
        href: '/search',
        regex: /^search\/?([-_a-zA-Z0-9]+)?/,
        action: param => new Search(param[0])
    },
    manage: {
        Class: null,
        href: '/inventory/manage',
        regex: /^inventory\/manage$/,
        action: () => new Inventory()
    },
    hosts: {
        Class: Host,
        href: '/inventory/hosts',
        regex: /^inventory\/hosts\/?([0-9]+)?$/,
        action: param => param[0] ? new Host({id: param[0], links: {self: param.input}}).viewer() : new Host().selector()
    },
    groups: {
        Class: Group,
        href: '/inventory/groups',
        regex: /^inventory\/groups\/?([0-9]+)?$/,
        action: param => param[0] ? new Group({id: param[0], links: {self: param.input}}).viewer() : new Group().selector()
    },
    users: {
        href: '/iam/users',
        regex: /^iam\/users\/?([0-9]+)?$/,
        Class: User,
        action: param => param[0] ? new User({id: param[0], links: {self: param.input}}).viewer() : new User().selector()
    },
    usergroups: {
        href: '/iam/usergroups',
        regex: /^iam\/usergroups\/?([0-9]+)?$/,
        Class: UserGroup,
        action: param => param[0] ? new UserGroup({id: param[0], links: {self: param.input}}).viewer() : new UserGroup().selector()
    },
    projects: {
        href: '/projects/',
        regex: /^projects\/?([0-9]+)?$/,
        Class: Project,
        action: param => param[0] ? new Project({id: param[0], links: {self: param.input}}).viewer() : new Project().selector()
    },
    repository: {
        href: '/files/repository',
        search:'/files/search',
        regex: /^files\/repository\/?[\s\S]*$/,
        Class: FileObj,
        action: param => new FileObj({links: {self: param.input}}).selector()
    },
    playbooks: {
        href: '/files/playbooks',
        regex: /^files\/playbooks\/?[\s\S]*$/,
        Class: Playbook,
        action: param => new Playbook({links: {self: param.input}}).selector()
    },
    roles: {
        href: '/files/roles',
        regex: /^files\/roles\/?[\s\S]*$/,
        Class: Role,
        action: param => new Role({links: {self: param.input}}).selector()
    },
    runner: {
        href: '/runner/runner',
        regex: /^runner\/runner$/,
        Class: null,
        action: () => new Runner()
    },
    adhoctasks: {
        href:'/runner/adhoctasks',
        Class: AdHocTask,
        regex: null
    },
    jobs: {
        href: '/runner/jobs',
        Class: Job,
        regex: /^runner\/jobs\/?([0-9]+)?$/,
    }
};

for (let k in Entities) if (Entities.hasOwnProperty(k)) Entities[k].regex && Router.add(Entities[k].regex, Entities[k].action);

Router.add(/[\s\S]*/, function () {

    $(mainContainer).empty();

    BaseModel.prototype.statusAlert('warning', 'Page not found')

});