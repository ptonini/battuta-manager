from django import forms

from .models import AdHoc, Runner, Task


class RunnerForm(forms.ModelForm):
    class Meta:
        model = Runner
        fields = ['name', 'pattern', 'sudo']


class AdHocForm(forms.ModelForm):
    class Meta:
        model = AdHoc
        fields = ['module', 'pattern', 'arguments', 'sudo']





