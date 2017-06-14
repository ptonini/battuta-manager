from django import forms

from .models import AdHocTask, PlaybookArgs, Job


class JobForm(forms.ModelForm):
    class Meta:
        model = Job
        fields = ['name', 'check', 'tags', 'skip_tags', 'subset', 'type', 'extra_vars', 'cred']


class AdHocTaskForm(forms.ModelForm):
    class Meta:
        model = AdHocTask
        fields = ['module', 'hosts', 'arguments', 'become']


class PlaybookArgsForm(forms.ModelForm):
    class Meta:
        model = PlaybookArgs
        fields = ['playbook', 'subset', 'tags', 'skip_tags', 'extra_vars']