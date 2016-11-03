from django import forms

from .models import AdHocTask, PlaybookArgs, Runner


class RunnerForm(forms.ModelForm):
    class Meta:
        model = Runner
        fields = ['name', 'check', 'tags', 'skip_tags', 'subset', 'type', 'extra_vars', 'cred']


class AdHocTaskForm(forms.ModelForm):
    class Meta:
        model = AdHocTask
        fields = ['module', 'hosts', 'arguments', 'become']


class PlaybookArgsForm(forms.ModelForm):
    class Meta:
        model = PlaybookArgs
        fields = ['playbook', 'subset', 'tags', 'skip_tags', 'extra_vars']