from django import forms

from .models import Group, Host, Variable


class HostForm(forms.ModelForm):

    class Meta:

        model = Host

        fields = ['name', 'description']


class GroupForm(forms.ModelForm):

    class Meta:

        model = Group

        fields = ['name', 'description', 'config']


class VariableForm(forms.ModelForm):

    class Meta:

        model = Variable

        fields = ['key', 'value', 'node']
