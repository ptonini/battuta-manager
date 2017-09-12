import json
import os
import datetime

from django.conf import settings

from apps.projects.models import Project

from apps.inventory.extras import get_node_descendants

import pprint
pp = pprint.PrettyPrinter(indent=4)


class ProjectAuth:

    def __init__(self, user):

        self._user = user

        self._editable_nodes = set()

        self._executable_hosts = set()

        self._editable_task_hosts = set()

        self._editable_files = set()

        self._usable_playbooks = set()

        self._usable_roles = set()

        self._inventory_projects = set()

        self._runner_projects = set()

        self._execute_projects = set()

        self._last_load = None

        self._max_age = datetime.timedelta(seconds=30)

        self._load()

    def _load(self):

        for group in self._user.groups.all():

            self._inventory_projects.update({p for p in Project.objects.all() if p.inventory_admins == group})

            self._runner_projects.update({p for p in Project.objects.all() if p.runner_admins == group})

            self._execute_projects.update({p for p in Project.objects.all() if p.execute_jobs == group})

        for project in Project.objects.all():

            if self._user == project.manager:

                self._inventory_projects.add(project)

                self._runner_projects.add(project)

                self._execute_projects.add(project)

        for project in self._inventory_projects:

            group_descendants, host_descendants = get_node_descendants(project.host_group)

            self._editable_nodes.update(host_descendants)

            self._editable_nodes.update(group_descendants)

        for project in self._runner_projects:

            group_descendants, host_descendants = get_node_descendants(project.host_group)

            full_playbook_names = json.loads(project.playbooks)

            self._editable_task_hosts.update({host.name for host in host_descendants})

            self._editable_files.update({os.path.join(p['folder'], p['name']) for p in full_playbook_names})

            for role in json.loads(project.roles):

                for root, dirs, files in os.walk(os.path.join(settings.ROLES_PATH, role['name'])):

                    for f in files:

                        self._editable_files.add(os.path.join(root.replace(settings.ROLES_PATH + '/', ''), f))

        for project in self._execute_projects:

            group_descendants, host_descendants = get_node_descendants(project.host_group)

            full_playbook_names = json.loads(project.playbooks)

            self._executable_hosts.update({host.name for host in host_descendants})

            self._usable_playbooks.update({os.path.join(p['folder'], p['name']) for p in full_playbook_names})

            for role in json.loads(project.roles):

                for root, dirs, files in os.walk(os.path.join(settings.ROLES_PATH, role['name'])):

                    for f in files:

                        self._usable_roles.add(os.path.join(root.replace(settings.ROLES_PATH + '/', ''), f))

        self._last_load = datetime.datetime.now()

    def reload(self):

        self._editable_nodes = set()

        self._executable_hosts = set()

        self._editable_task_hosts = set()

        self._editable_files = set()

        self._usable_playbooks = set()

        self._usable_roles = set()

        self._inventory_projects = set()

        self._runner_projects = set()

        self._execute_projects = set()

        self._load()

    def can_edit_variable(self, node):

        if datetime.datetime.now() - self._last_load > self._max_age:

            self.reload()

        return True if node.id and node in self._editable_nodes else False

    def can_execute_job(self, inventory, pattern):

        if datetime.datetime.now() - self._last_load > self._max_age:

            self.reload()

        return inventory.get_host_names(pattern).issubset(self._executable_hosts)

    def can_edit_task(self, inventory, pattern):

        if datetime.datetime.now() - self._last_load > self._max_age:

            self.reload()

        return inventory.get_host_names(pattern).issubset(self._editable_task_hosts)

    def can_use_playbook(self, playbook):

        if datetime.datetime.now() - self._last_load > self._max_age:

            self.reload()

        return True if playbook in self._usable_playbooks else False

    def can_edit_file(self, file_path):

        if datetime.datetime.now() - self._last_load > self._max_age:

            self.reload()

        return True if file_path in self._editable_files else False