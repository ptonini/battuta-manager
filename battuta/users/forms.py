from django import forms

from .models import User, UserData, Credentials


class UserForm(forms.ModelForm):
    class Meta:
        model = User
        fields = ('username', 'password', 'first_name', 'last_name', 'email')


class UserDataForm(forms.ModelForm):
    class Meta:
        model = UserData
        fields = ('timezone',)


class CredentialsForm(forms.ModelForm):
    class Meta:
        model = Credentials
        fields = ('title', 'is_shared', 'username', 'password', 'rsa_key', 'sudo_user', 'sudo_pass', 'ask_sudo_pass')
