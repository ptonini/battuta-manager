__author__ = 'ptonini'

from django import forms

from .models import User, UserData


class UserForm(forms.ModelForm):
    class Meta:
        model = User
        fields = ('username', 'password', 'first_name', 'last_name', 'email')


class UserDataForm(forms.ModelForm):
    class Meta:
        model = UserData
        fields = ('timezone', 'ansible_username', 'rsa_key')
