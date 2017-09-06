import json
import os

from apps.projects.models import Project

from apps.inventory.extras import get_node_descendants


def auth_action(user, action, node=None, pattern=None, inventory=None, playbook=None):

    authorized = {
        'editable_nodes': set(),
        'executable_hosts': set(),
        'editable_task_hosts': set(),
        'editable_playbooks': set(),
        'usable_playbooks': set()
    }

    inventory_projects = set()

    runner_projects = set()

    execute_projects = set()

    for group in user.groups.all():

        inventory_projects.update({p for p in Project.objects.all() if p.inventory_admins == group})

        runner_projects.update({p for p in Project.objects.all() if p.runner_admins == group})

        execute_projects.update({p for p in Project.objects.all() if p.execute_jobs == group})

    for project in Project.objects.all():

        if user == project.manager:

            inventory_projects.add(project)

            runner_projects.add(project)

            execute_projects.add(project)

    for project in inventory_projects:

        group_descendants, host_descendants = get_node_descendants(project.host_group)

        authorized['editable_nodes'].update(host_descendants)

        authorized['editable_nodes'].update(group_descendants)

    for project in runner_projects:

        group_descendants, host_descendants = get_node_descendants(project.host_group)

        full_playbook_names = json.loads(project.playbooks)

        authorized['editable_task_hosts'].update({host.name for host in host_descendants})

        authorized['editable_playbooks'].update({os.path.join(p['folder'], p['name']) for p in full_playbook_names})

    for project in execute_projects:

        group_descendants, host_descendants = get_node_descendants(project.host_group)

        authorized['executable_hosts'].update({host.name for host in host_descendants})

        authorized['usable_playbooks'].update({os.path.join(p['folder'], p['name']) for p in full_playbook_names})

    if action == 'edit_variables':

        return True if node.id and node in authorized['editable_nodes'] else False

    elif action == 'execute_job':

        return inventory.get_host_names(pattern).issubset(authorized['executable_hosts'])

    elif action == 'edit_task':

        return inventory.get_host_names(pattern).issubset(authorized['editable_task_hosts'])

    elif action == 'use_playbook':

        return True if playbook in authorized['usable_playbooks'] else False
