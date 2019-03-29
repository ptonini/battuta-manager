from django.shortcuts import render
from django.views.generic import View
from django.http import HttpResponse, HttpResponseBadRequest
from django.contrib.auth import authenticate, login, logout

from main.extras.mixins import RESTfulViewMixin
from apps.iam.extras import build_default_cred


class PageView(View):

    @staticmethod
    def get(request):

        return render(request, 'main/main.html') if request.user.is_authenticated else render(request, 'main/login.html')


class MainView(View, RESTfulViewMixin):

    def get(self, request):

        return self._api_response({'meta': {'user': request.user.serialize(request.JSON.get('fields'), request.user)}})


class LoginView(View, RESTfulViewMixin):

    def post(self, request, action):

        if action == 'login':

            user = authenticate(username=request.JSON.get('data', {}).get('username'),
                                password=request.JSON.get('data', {}).get('password'))

            if user:

                if user.is_active:

                    login(request, user)

                    build_default_cred(user) if not user.default_cred else None;

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
