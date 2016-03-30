from django import forms

from .models import AdHoc, Runner, PlayArguments


class RunnerForm(forms.ModelForm):
    class Meta:
        model = Runner
        fields = ['name', 'hosts', 'check', 'tags', 'subset']


class AdHocForm(forms.ModelForm):
    class Meta:
        model = AdHoc
        fields = ['module', 'hosts', 'arguments', 'become']


class PlayArgsForm(forms.ModelForm):
    class Meta:
        model = PlayArguments
        fields = ['playbook', 'subset', 'tags']



