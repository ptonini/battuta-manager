from django.contrib import admin

# Register your models here.
from .models import Host, Group, Variable


class VariableInLine(admin.TabularInline):
    model = Variable
    extra = 3
    fields = ['key', 'value']


class HostsAdmin(admin.ModelAdmin):
    inlines = [VariableInLine]
    list_filter = ['group']
    list_display = ['name']


class GroupsAdmin(admin.ModelAdmin):
    filter_horizontal = ['members', 'children']
    inlines = [VariableInLine]
    list_filter = ['children', 'members']
    list_display = ['name']


admin.site.register(Host, HostsAdmin)
admin.site.register(Group, GroupsAdmin)
