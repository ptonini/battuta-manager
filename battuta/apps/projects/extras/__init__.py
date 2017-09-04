from apps.projects.models import Project

from apps.inventory.extras import BattutaInventory


def authorize_action(user, action, node):

    authorized = {
        'nodes': set()
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

        group_descendants, host_descendants = BattutaInventory.get_node_descendants(project.host_group)

        authorized['nodes'].update(host_descendants)

        authorized['nodes'].update(group_descendants)

    if action == 'edit_variables':

        return True if node.id and node in authorized['nodes'] else False

