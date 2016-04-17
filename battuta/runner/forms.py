from django import forms

from .models import AdHocTask, PlaybookArgs, Runner


class RunnerForm(forms.ModelForm):
    class Meta:
        model = Runner
        fields = ['name', 'check', 'tags', 'subset']


class AdHocTaskForm(forms.ModelForm):
    class Meta:
        model = AdHocTask
        fields = ['module', 'hosts', 'arguments', 'become']


class PlaybookArgsForm(forms.ModelForm):
    class Meta:
        model = PlaybookArgs
        fields = ['playbook', 'subset', 'tags']



