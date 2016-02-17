from django import forms

from .models import AdHoc, Runner, Task


class RunnerForm(forms.ModelForm):
    class Meta:
        model = Runner
        fields = ['name', 'hosts', 'check', 'tags', 'subset']


class AdHocForm(forms.ModelForm):
    class Meta:
        model = AdHoc
        fields = ['module', 'hosts', 'arguments', 'become']





