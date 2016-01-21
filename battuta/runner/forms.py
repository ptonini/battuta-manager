__author__ = 'ptonini'

from django import forms

from runner.models import AdHoc


class AdHocForm(forms.ModelForm):
    class Meta:
        model = AdHoc
        fields = ['module', 'pattern', 'arguments', 'sudo']





