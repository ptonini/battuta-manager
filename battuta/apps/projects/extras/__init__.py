import json
import os

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

            self._editable_task_hosts.update({host.name for host in host_descendants})

            for p in json.loads(project.playbooks):

                if p['folder']:

                    self._editable_files.add(os.path.join(settings.PLAYBOOK_PATH, p['folder']))

                self._editable_files.add(os.path.join(settings.PLAYBOOK_PATH, p['folder'], p['name']))

            for role in json.loads(project.roles):

                role_path = os.path.join(settings.ROLES_PATH, role['name'])

                self._editable_files.add(role_path)

                for root, dirs, files in os.walk(role_path):

                    for f in files:

                        self._editable_files.add(os.path.join(root, f))

                    for d in dirs:

                        self._editable_files.add(os.path.join(root, d))

        for project in self._execute_projects:

            group_descendants, host_descendants = get_node_descendants(project.host_group)

            full_playbook_names = json.loads(project.playbooks)

            self._executable_hosts.update({host.name for host in host_descendants})

            self._usable_playbooks.update({os.path.join(p['folder'], p['name']) for p in full_playbook_names})

            self._usable_roles.update({os.path.join(r['folder'], r['name']) for r in (json.loads(project.roles))})

    def can_edit_variable(self, node):

        return True if node.id and node in self._editable_nodes else False

    def can_execute_job(self, inventory, pattern):

        return inventory.get_host_names(pattern).issubset(self._executable_hosts)

    def can_edit_task(self, inventory, pattern):

        return inventory.get_host_names(pattern).issubset(self._editable_task_hosts)

    def can_use_playbook(self, playbook):

        return True if playbook in self._usable_playbooks else False

    def can_edit_file(self, file_path):

        return True if file_path in self._editable_files else False
