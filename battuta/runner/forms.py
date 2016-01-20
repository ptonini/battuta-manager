__author__ = 'ptonini'

from django import forms
from .models import AdHoc


class AdHocForm(forms.ModelForm):
    class Meta:
        model = AdHoc
        fields = ['module', 'pattern', 'arguments', 'sudo']





