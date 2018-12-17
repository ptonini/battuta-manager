from django.shortcuts import render
from django.views.generic import View
from django.http import HttpResponse, HttpResponseBadRequest
from django.contrib.auth import authenticate, login, logout

from main.extras.views import ApiView
from apps.iam.models import LocalUser


class PageView(View):

    @staticmethod
    def get(request):

        return render(request, 'main/main.html')


class MainView(ApiView):

    def get(self, request):

        if request.user.is_authenticated:

            fields = {
                'attributes': ['username', 'timezone'],
                'links':['self']
            }

            response = {'meta': {'user': request.user.serialize(fields, request.user)}}

        else:

            response = {'meta': {'user': None}}

        return self._api_response(response)


class LoginView(ApiView):

    def post(self, request, action):

        if action == 'login':

            user = authenticate(username=request.JSON.get('data', {}).get('username'),
                                password=request.JSON.get('data', {}).get('password'))

            if user:

                if user.is_active:

                    login(request, user)

                    return HttpResponse(status=204)

                else:

                    return self._api_response({'errors': [{'title': 'Account disabled'}]})

            else:

                return self._api_response({'errors': [{'title': 'Invalid login'}]})

        elif action == 'logout':

            logout(request)

            return HttpResponse(status=204)

        else:

            return HttpResponseBadRequest()