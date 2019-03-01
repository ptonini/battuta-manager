from django import forms

from .models import AdHocTask, PlaybookArgs, Job


class JobForm(forms.ModelForm):

    class Meta:

        model = Job

        fields = ['name', 'job_type', 'parameters', 'user', 'cred', 'check']


class AdHocTaskForm(forms.ModelForm):

    class Meta:

        model = AdHocTask

        fields = ['name', 'hosts', 'module', 'arguments', 'become']


class PlaybookArgsForm(forms.ModelForm):

    class Meta:

        model = PlaybookArgs

        fields = ['path', 'subset', 'tags', 'skip_tags', 'extra_vars']
