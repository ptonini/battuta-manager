from django.shortcuts import render
from django.views.generic import View
from django.http import HttpResponseBadRequest, HttpResponseNotFound
from django.contrib.auth import authenticate, login, logout

from main.extras.views import ApiView

class PageView(View):

    @staticmethod
    def get(request, **kwargs):

        if kwargs['page'] == 'main':

            return render(request, 'main/main.html')

        elif kwargs['page'] == 'search':

            return render(request, 'main/search.html', {'pattern': kwargs['pattern']})

        else:

            return HttpResponseNotFound()


class LoginView(ApiView):

    def post(self, request, action):

        if action == 'login':

            user = authenticate(username=request.JSON.get('data', {}).get('username'),
                                password=request.JSON.get('data', {}).get('password'))

            if user:

                if user.is_active:

                    login(request, user)

                    response = {'data': {}}

                else:

                    response = {'errors': [{'title': 'Account disabled'}]}

            else:

                response = {'errors': [{'title': 'Invalid login'}]}

        elif action == 'logout':

            logout(request)

            response = {'data': {}}

        else:

            return HttpResponseBadRequest()

        return self._api_response(response)