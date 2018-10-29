import json

from pytz import timezone
from django.http import HttpResponse
from django.http import HttpResponseBadRequest
from django.utils.deprecation import MiddlewareMixin



def download_file(f, filename):

    f.seek(0)

    response = HttpResponse(f.read(), content_type="application/octet-stream")

    response['Content-Disposition'] = 'inline; filename=' + filename

    return response


class DataTableRequestHandler:

    def __init__(self, request, queryset):

        self._draw = int(request.GET['draw'])

        self._start = int(request.GET['start'])

        self._length = int(request.GET['length'])

        self._search = {
            'value': request.GET['search[value]'],
            'regex': request.GET['search[regex]'] == 'true'
        }

        self._order = list()

        self._columns = list()

        self._filtered_result = list()

        self._queryset = queryset

        self._tz = timezone(request.user.userdata.timezone)

        i = 0

        while 'order[' + str(i) + '][column]' in request.GET:

            self._order.append({
                'column': int(request.GET['order[' + str(i) + '][column]']),
                'dir': request.GET['order[' + str(i) + '][dir]']
            })

            i += 1

        j = 0

        while 'columns[' + str(j) + '][data]' in request.GET:

            self._columns.append({
                'data': int(request.GET['columns[' + str(j) + '][data]']),
                'name': request.GET['columns[' + str(j) + '][name]'],
                'orderable': request.GET['columns[' + str(j) + '][orderable]'] == 'true',
                'searchable': request.GET['columns[' + str(j) + '][searchable]'] == 'true',
                'search': {
                    'value': request.GET['columns[' + str(j) + '][search][value]'],
                    'regex': request.GET['columns[' + str(j) + '][search][regex]'] == 'true',
                },
            })

            j += 1

    def _filter_queryset(self):

        pass

    def build_response(self):

        self._filter_queryset()

        for col_order in self._order:

            self._filtered_result.sort(key=lambda x: x[col_order['column']], reverse=col_order['dir'] == 'desc')

        return {
            'draw': self._draw,
            'recordsTotal': len(self._queryset),
            'recordsFiltered': len(self._filtered_result),
            'data': self._filtered_result[self._start:self._start + self._length]
        }


class PutParsingMiddleware(MiddlewareMixin):

    @staticmethod
    def process_request(request):

        if request.method == "PUT" and request.content_type != "application/json":

            if hasattr(request, '_post'):

                del request._post

                del request._files

            try:

                request.method = "POST"

                request._load_post_and_files()

                request.method = "PUT"

            except AttributeError as e:

                request.META['REQUEST_METHOD'] = 'POST'

                request._load_post_and_files()

                request.META['REQUEST_METHOD'] = 'PUT'

            request.PUT = request.POST


class JSONParsingMiddleware(MiddlewareMixin):

    @staticmethod
    def process_request(request):

        if (request.method == "PUT" or request.method == "POST") and request.content_type == "application/json":

            try:

                request.JSON = json.loads(request.body)

            except ValueError as ve:

                return HttpResponseBadRequest("unable to parse JSON data. Error : {0}".format(ve))