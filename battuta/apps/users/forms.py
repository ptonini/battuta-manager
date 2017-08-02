from django import forms

from .models import User, Group, UserData, GroupData, Credential


class UserForm(forms.ModelForm):
    class Meta:
        model = User
        fields = ('username', 'password', 'first_name', 'last_name', 'email')


class UserDataForm(forms.ModelForm):
    class Meta:
        model = UserData
        fields = ('timezone',)


class GroupForm(forms.ModelForm):
    class Meta:
        model = Group
        fields = ('name',)

class CredentialForm(forms.ModelForm):
    class Meta:
        model = Credential
        fields = '__all__'
