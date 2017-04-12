from django.shortcuts import render
from django.views.generic import View
from django.http import Http404


class PageView(View):

    @staticmethod
    def get(request, **kwargs):

        if kwargs['page'] == 'main':

            return render(request, 'main/main.html', {'user': request.user})

        elif kwargs['page'] == 'search':

            return render(request, 'main/search.html', {'pattern': kwargs['pattern']})

        else:
            raise Http404('Invalid page')
