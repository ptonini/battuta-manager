const Entities = {
    main: {
        model: null,
        href: '/main',
        regex: /^main$/,
        action: () => $(mainContainer).off().empty()
    },
    search: {
        model: null,
        href: '/search',
        regex: /^search\/?([-_a-zA-Z0-9]+)?/,
        action: param => new Search(param[0])
    },
    manage: {
        model: null,
        href: '/inventory/manage',
        regex: /^inventory\/manage$/,
        action: () => new InventoryManager()
    },
    hosts: {
        model: Host,
        href: '/inventory/hosts',
        regex: /^inventory\/hosts\/?([0-9]+)?$/,
        action: param => param[0] ? new Host({id: param[0], links: {self: param.input}}).viewer() : new Host().selector()
    },
    groups: {
        model: Group,
        href: '/inventory/groups',
        regex: /^inventory\/groups\/?([0-9]+)?$/,
        action: param => param[0] ? new Group({id: param[0], links: {self: param.input}}).viewer() : new Group().selector()
    },
    users: {
        model: User,
        href: '/iam/users',
        regex: /^iam\/users\/?([0-9]+)?$/,
        action: param => param[0] ? new User({id: param[0], links: {self: param.input}}).viewer() : new User().selector()
    },
    usergroups: {
        model: UserGroup,
        href: '/iam/usergroups',
        regex: /^iam\/usergroups\/?([0-9]+)?$/,
        action: param => param[0] ? new UserGroup({id: param[0], links: {self: param.input}}).viewer() : new UserGroup().selector()
    },
    projects: {
        model: Project,
        href: '/projects/',
        regex: /^projects\/?([0-9]+)?$/,
        action: param => param[0] ? new Project({id: param[0], links: {self: param.input}}).viewer() : new Project().selector()
    },
    repository: {
        model: FileObj,
        href: '/files/repository',
        search:'/files/search',
        regex: /^files\/repository\/?[\s\S]*$/,
        action: param => new FileObj({links: {self: param.input}}).selector()
    },
    playbooks: {
        model: Playbook,
        href: '/files/playbooks',
        regex: /^files\/playbooks\/?[\s\S]*$/,
        action: param => new Playbook({links: {self: param.input}}).selector()
    },
    roles: {
        model: Role,
        href: '/files/roles',
        regex: /^files\/roles\/?[\s\S]*$/,
        action: param => new Role({links: {self: param.input}}).selector()
    },
    runner: {
        model: null,
        href: '/runner/runner',
        regex: /^runner\/runner$/,
        action: () => new Runner()
    },
    adhoctasks: {
        model: AdHocTask,
        href:'/runner/adhoctasks',
    },
    jobs: {
        model: Job,
        href: '/runner/jobs',
        regex: /^runner\/jobs\/?([0-9]+)?$/,
        action: param => param[0] ? new Job({id: param[0], links: {self: param.input}}).viewer() : new Job().selector()
    }
};

for (let k in Entities) if (Entities.hasOwnProperty(k)) Entities[k].regex && Router.add(Entities[k].regex, Entities[k].action);

Router.add(/[\s\S]*/, function () {

    AlertBox.status('warning', 'Page not found')

});