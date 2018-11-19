from django import forms

from .models import LocalUser, LocalGroup, Credential


class LocalUserForm(forms.ModelForm):

    class Meta:

        model = LocalUser

        fields = ('username', 'first_name', 'last_name', 'email', 'timezone')


class LocalGroupForm(forms.ModelForm):

    class Meta:

        model = LocalGroup

        fields = ('name',)


class CredentialForm(forms.ModelForm):

    class Meta:

        model = Credential

        fields = '__all__'
