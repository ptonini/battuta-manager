import json

from django.shortcuts import render
from django.views.generic import View


class MainView(View):
    @staticmethod
    def get(request):
        return render(request, 'main/main.html', {'user': request.user})


class SearchView(View):
    @staticmethod
    def get(request, pattern):
        return render(request, 'main/search.html', {'pattern': pattern})


