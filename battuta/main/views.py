import json

from django.shortcuts import render
from django.views.generic import View
from django.core.exceptions import PermissionDenied
from django.http import HttpResponse
from django.conf import settings
from constance import config


class MainView(View):
    @staticmethod
    def get(request):
        return render(request, "main.html", {'user': request.user})


class SearchView(View):
    @staticmethod
    def get(request):
        if request.GET['search_pattern'] == '':
            return render(request, "main.html", {'user': request.user})
        else:
            return render(request, "search.html", {'search_pattern': request.GET['search_pattern']})
