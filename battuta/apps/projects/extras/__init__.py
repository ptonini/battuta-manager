import json
import os
import yaml

from django.conf import settings

from apps.projects.models import Project
from apps.inventory.extras import get_node_descendants

import pprint
pp = pprint.PrettyPrinter(indent=4)


class ProjectAuth:

    def __init__(self, user):

        self._user = user

        self._editable_nodes = set()

        self._runnable_task_hosts = set()

        self._editable_task_hosts = set()

        self._runnable_playbooks = set()

        self._editable_files = set()

        self._can_edit_variables = set()

        self._can_run_tasks = set()

        self._can_edit_tasks = set()

        self._can_run_playbooks = set()

        self._can_edit_playbooks = set()

        self._can_edit_roles = set()

        self._managed_groups = set()

        self._managed_projects = {p for p in Project.objects.all() if self._user == p.manager}

        for group in self._user.groups.all():

            self._can_edit_variables.update({p for p in Project.objects.all() if p.can_edit_variables == group})

            self._can_run_tasks.update({p for p in Project.objects.all() if p.can_run_tasks == group})

            self._can_edit_tasks.update({p for p in Project.objects.all() if p.can_edit_tasks == group})

            self._can_run_playbooks.update({p for p in Project.objects.all() if p.can_run_playbooks == group})

            self._can_edit_playbooks.update({p for p in Project.objects.all() if p.can_edit_playbooks == group})

            self._can_edit_roles.update({p for p in Project.objects.all() if p.can_edit_roles == group})

        for project in self._managed_projects:

            self._managed_groups.add(project.can_edit_variables)

            self._managed_groups.add(project.can_run_tasks)

            self._managed_groups.add(project.can_edit_tasks)

            self._managed_groups.add(project.can_run_playbooks)

            self._managed_groups.add(project.can_edit_playbooks)

            self._managed_groups.add(project.can_edit_roles)

        for project in self._can_edit_variables:

            group_descendants, host_descendants = get_node_descendants(project.host_group)

            self._editable_nodes.update(host_descendants)

            self._editable_nodes.update(group_descendants)

        for project in self._can_run_tasks:

            group_descendants, host_descendants = get_node_descendants(project.host_group)

            self._runnable_task_hosts.update({host.name for host in host_descendants})

        for project in self._can_edit_tasks:

            group_descendants, host_descendants = get_node_descendants(project.host_group)

            self._editable_task_hosts.update({host.name for host in host_descendants})

        for project in self._can_run_playbooks:

            for p in json.loads(project.playbooks):

                self._runnable_playbooks.add(os.path.join(settings.PLAYBOOK_PATH, p['folder']))

                self._runnable_playbooks.add(os.path.join(settings.PLAYBOOK_PATH, p['folder'], p['name']))

        for project in self._can_edit_playbooks:

            for p in json.loads(project.playbooks):

                self._editable_files.add(os.path.join(settings.PLAYBOOK_PATH, p['folder']))

                self._editable_files.add(os.path.join(settings.PLAYBOOK_PATH, p['folder'], p['name']))

        for project in self._can_edit_roles:

            for role in json.loads(project.roles):

                role_path = os.path.join(settings.ROLES_PATH, role['name'])

                self._editable_files.add(role_path)

                for root, dirs, files in os.walk(role_path):

                    for f in files:

                        self._editable_files.add(os.path.join(root, f))

                    for d in dirs:

                        self._editable_files.add(os.path.join(root, d))

    def is_manager(self):

        return True if len(self._managed_projects) > 0 else False

    def can_edit_variables(self, node):

        return True if node.id and node in self._editable_nodes else False

    def can_run_tasks(self, inventory, pattern):

        return inventory.get_host_names(pattern).issubset(self._runnable_task_hosts)

    def can_edit_tasks(self, inventory, pattern):

        return inventory.get_host_names(pattern).issubset(self._editable_task_hosts)

    def can_run_playbooks(self, inventory, playbook_path):

        with open(os.path.join(playbook_path), 'r') as playbook_file:

            auth = set()

            for pattern in [play['hosts'] for play in yaml.load(playbook_file.read())]:

                auth.add(inventory.get_host_names(pattern).issubset(self._runnable_task_hosts))

        return True if playbook_path in self._runnable_playbooks and False not in auth else False

    def can_view_file(self, file_path):

        return True if file_path in self._editable_files or file_path in self._runnable_playbooks else False

    def can_edit_file(self, file_path):

        return True if file_path in self._editable_files else False

    def authorize_job(self, inventory, job):

        if job.type == 'playbook':

            playbook_path = os.path.join(settings.PLAYBOOK_PATH, job.folder if job.folder else '', job.name)

            return self.can_run_playbooks(inventory, playbook_path)

        else:

            return self.can_run_tasks(inventory, job.subset)

    def can_add_to_group(self, group):

        return True if group in self._managed_groups else False
