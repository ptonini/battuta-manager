from django import forms

from .models import Item, ItemGroup


class ItemForm(forms.ModelForm):
    class Meta:
        model = Item
        fields = ['name', 'description', 'data_type', 'item_group']


class ItemGroupForm(forms.ModelForm):
    class Meta:
        model = ItemGroup
        fields = ['name', 'description']
