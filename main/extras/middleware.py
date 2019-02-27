import json

from django.http import HttpResponseBadRequest
from django.utils.deprecation import MiddlewareMixin



class FileDataParsingMiddleware(MiddlewareMixin):

    @staticmethod
    def process_request(request):

        if request.method in ['PATCH', 'PUT'] and request.content_type != 'application/vnd.api+json':

            method = request.method

            if hasattr(request, '_post'):

                delattr(request, '_post')

                delattr(request, '_files')

            try:

                request.method = "POST"

                getattr(request, '_load_post_and_files')()

                request.method = method

            except AttributeError:

                request.META['REQUEST_METHOD'] = 'POST'

                getattr(request, '_load_post_and_files')()

                request.META['REQUEST_METHOD'] = method

            if method == 'PATCH':

                request.PATCH = request.POST

            elif method == 'PUT':

                request.PUT = request.POST


class JSONParsingMiddleware(MiddlewareMixin):

    @staticmethod
    def process_request(request):

        request.JSON = {}

        if request.content_type == 'application/vnd.api+json':

            try:

                if request.method in ['PATCH', 'PUT', 'POST']:

                    request.JSON = json.loads(request.body.decode('utf8') if request.body else '{}')

                elif request.method in ['GET', 'DELETE']:

                    for k, v in request.GET.items():

                        request.JSON[k] = json.loads(v)

            except ValueError as e:

                return HttpResponseBadRequest('Unable to parse JSON data. Error : {0}'.format(e))

