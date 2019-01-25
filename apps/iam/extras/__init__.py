import json
import os
import yaml

from django.conf import settings
from django.db.models.signals import post_save, post_delete, m2m_changed
from django.dispatch import receiver
from django.core.cache import caches

from main.extras.signals import clear_authorizer

class Authorizer:

    def __init__(self, user):

        from apps.projects.models import Project

        from apps.files.extras import PlaybookHandler, RoleHandler

        self._user = user

        self._editable_var_nodes = set()

        self._runnable_task_hosts = set()

        self._editable_task_hosts = set()

        self._runnable_playbooks = set()

        self._editable_files = set()

        self._editable_folders = set()

        self._readable_files = set()

        self._readable_folders = set()

        self._managed_projects = {p for p in Project.objects.filter(manager=self._user)}

        can_edit_variables = {p for p in Project.objects.filter(can_edit_variables__id=self._user.id)}

        can_edit_variables.update({p for p in self._managed_projects})

        can_run_tasks = {p for p in Project.objects.filter(can_run_tasks__id=self._user.id)}

        can_run_tasks.update({p for p in self._managed_projects})

        can_edit_tasks = {p for p in Project.objects.filter(can_edit_tasks__id=self._user.id)}

        can_edit_tasks.update({p for p in self._managed_projects})

        can_run_playbooks = {p for p in Project.objects.filter(can_run_playbooks__id=self._user.id)}

        can_run_playbooks.update({p for p in self._managed_projects})

        can_edit_playbooks = {p for p in Project.objects.filter(can_edit_playbooks__id=self._user.id)}

        can_edit_playbooks.update({p for p in self._managed_projects})

        can_edit_roles = {p for p in Project.objects.filter(can_edit_roles__id=self._user.id)}

        can_edit_roles.update({p for p in self._managed_projects})

        for project in can_edit_variables:

            if project.host_group:

                groups, hosts = project.host_group.get_descendants()

                self._editable_var_nodes.add(project.host_group)

                self._editable_var_nodes.update(hosts)

                self._editable_var_nodes.update(groups)

        for project in can_run_tasks:

            if project.host_group:

                self._runnable_task_hosts.update({host for host in project.host_group.get_descendants()[1]})

        for project in can_edit_tasks:

            if project.host_group:

                self._editable_task_hosts.update({host for host in project.host_group.get_descendants()[1]})

        for project in can_run_playbooks:

            for p in json.loads(project.playbooks):

                playbook = PlaybookHandler(p, self._user)

                self._runnable_playbooks.add(playbook)

                self._readable_files.add(playbook.absolute_path)

        for project in can_edit_playbooks:

            for p in json.loads(project.playbooks):

                playbook = PlaybookHandler(p, self._user)

                self._editable_files.add(playbook.absolute_path)

                self._readable_files.add(playbook.absolute_path)

                self._readable_folders.update({path for path in playbook.get_paths()})

        for project in can_edit_roles:

           self._editable_folders.update({RoleHandler(role, self._user).absolute_path for role in json.loads(project.roles)})

    def is_manager(self, project):

        return True if project in self._managed_projects else False

    def can_edit_variables(self, node):

        return True if node.id and node in self._editable_var_nodes else False

    def can_run_tasks(self, inventory, pattern):

        return inventory.get_host_names(pattern).issubset(self._runnable_task_hosts)

    def can_edit_tasks(self, inventory, pattern):

        return inventory.get_host_names(pattern).issubset(self._editable_task_hosts)

    def can_run_playbooks(self, inventory, playbook_path):

        from apps.files.extras import PlaybookHandler

        playbook = PlaybookHandler(playbook_path, self._user)

        with open(os.path.join(playbook_path), 'r') as playbook_file:

            auth = set()

            for pattern in [play['hosts'] for play in yaml.load(playbook_file.read())]:

                auth.add(inventory.get_host_names(pattern).issubset(self._runnable_task_hosts))

        return True if playbook_path in self._runnable_playbooks and False not in auth else False

    def can_view_fs_obj(self, path, fs_obj_type):

        for editable_path in self._editable_folders:

            if path.startswith(editable_path):

                return True

        if fs_obj_type == 'file':

            return True if path in self._readable_files else False

        else:

            return True if path in self._readable_folders else False

    def can_edit_fs_obj(self, path, fs_obj_type):

        for editable_path in self._editable_folders:

            if path.startswith(editable_path):

                return True

        if fs_obj_type == 'file':

            return True if path in self._editable_files else False

    def authorize_job(self, inventory, job):

        if job.type == 'playbook':

            playbook_path = os.path.join(settings.PLAYBOOK_PATH, job.folder if job.folder else '', job.name)

            return self.can_run_playbooks(inventory, playbook_path)

        else:

            return self.can_run_tasks(inventory, job.subset)

@receiver(clear_authorizer)
@receiver(post_save)
@receiver(post_delete)
@receiver(m2m_changed)
def clear_authorizers(sender, **kwargs):

    caches['authorizer'].clear()