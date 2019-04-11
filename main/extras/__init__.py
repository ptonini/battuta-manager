from pytz import timezone
from django.http import HttpResponse

from apps.preferences.extras import get_prefs


class DataTableRequestHandler:

    def __init__(self, request, queryset):

        self._draw = int(request.GET['draw'])

        self._start = int(request.GET['start'])

        self._length = int(request.GET['length'])

        self._search = {
            'value': request.GET.get('search[value]'),
            'regex': request.GET['search[regex]'] == 'true'
        }

        self._order = list()

        self._columns = list()

        self._filtered_result = list()

        self._queryset = queryset

        self._user = request.user

        self._tz = timezone(request.user.timezone if request.user.timezone else get_prefs('default_timezone'))

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

        return list()

    def build_response(self):

        filtered_result = self._filter_queryset()

        for col_order in self._order:

            filtered_result.sort(key=lambda x: x[col_order['column']], reverse=col_order['dir'] == 'desc')

        return {
            'draw': self._draw,
            'recordsTotal': len(self._queryset),
            'recordsFiltered': len(filtered_result),
            'data': filtered_result[self._start:self._start + self._length]
        }


def download_file(f, filename):

    f.seek(0)

    response = HttpResponse(f.read(), content_type="application/octet-stream")

    response['Content-Disposition'] = 'inline; filename=' + filename

    return response

