from django.db import models



class Project(models.Model):

    type = 'projects'

    name = models.CharField(max_length=64, blank=False, unique=True)

    description = models.TextField(max_length=256, blank=True)

    manager = models.ForeignKey('iam.LocalUser', null=True, blank=True, on_delete=models.CASCADE)

    host_group = models.ForeignKey('inventory.Group', null=True, blank=True, on_delete=models.CASCADE)

    playbooks = models.TextField(max_length=65536, default='[]')

    roles = models.TextField(max_length=65536, default='[]')

    can_edit_variables = models.ForeignKey('iam.LocalGroup', related_name='can_edit_variables', null=True, blank=True, on_delete=models.CASCADE)

    can_run_tasks = models.ForeignKey('iam.LocalGroup', related_name='can_run_tasks', null=True, blank=True, on_delete=models.CASCADE)

    can_edit_tasks = models.ForeignKey('iam.LocalGroup', related_name='can_edit_tasks', null=True, blank=True, on_delete=models.CASCADE)

    can_run_playbooks = models.ForeignKey('iam.LocalGroup', related_name='can_run_playbooks', null=True, blank=True, on_delete=models.CASCADE)

    can_edit_playbooks = models.ForeignKey('iam.LocalGroup', related_name='can_edit_playbooks', null=True, blank=True, on_delete=models.CASCADE)

    can_edit_roles = models.ForeignKey('iam.LocalGroup', related_name='can_edit_roles', null=True, blank=True, on_delete=models.CASCADE)

    def __str__(self):

        return self.name


