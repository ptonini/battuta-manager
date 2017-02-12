from django.conf import settings

import json


class DefaultPrefs:

    def __init__(self):
        self._schema = settings.DEFAULT_PREFERENCES
        self._items = [item for item_group in self._schema for item in item_group['items']]

    def get_value(self, name):
        for item in self._items:
            if item['name'] == name:
                return item['value']
        return None

    def get_items(self):
        return {item['name']: item['value'] for item in self._items}

    def get_schema(self):
        return self._schema

    def boolean_items(self):
        return [item['name'] for item in self._items if item['data_type'] == 'bool']


class DataTableRequestHandler:

    @staticmethod
    def _build_order_list(request_data):
        order_list = list()
        index = 0
        while 'order[' + str(index) + '][column]' in request_data:
            order_list.append({
                'column': int(request_data['order[' + str(index) + '][column]']),
                'dir': request_data['order[' + str(index) + '][dir]']
            })
            index += 1
        return order_list

    @staticmethod
    def _build_column_list(request_data):
        column_list = list()
        index = 0
        while 'columns[' + str(index) + '][data]' in request_data:
            column_list.append({
                'data': int(request_data['columns[' + str(index) + '][data]']),
                'name': request_data['columns[' + str(index) + '][name]'],
                'orderable': request_data['columns[' + str(index) + '][orderable]'] == 'true',
                'searchable': request_data['columns[' + str(index) + '][searchable]'] == 'true',
                'search': {
                    'value': request_data['columns[' + str(index) + '][search][value]'],
                    'regex': request_data['columns[' + str(index) + '][search][regex]'] == 'true',
                },
            })
            index += 1
        return column_list

    def __init__(self, request_data, queryset):

        self._draw = int(request_data['draw'])
        self._start = int(request_data['start'])
        self._length = int(request_data['length'])
        self._search = {'value': request_data['search[value]'],
                        'regex': request_data['search[regex]'] == 'true'}

        self._order = self._build_order_list(request_data)
        self._columns = self._build_column_list(request_data)

        self._queryset = queryset
        self._filtered_result = list()

    def add_and_filter_row(self, row):
        if not self._search['value'] or self._search['value'] in str(json.dumps(row)):
            self._filtered_result.append(row)

    def build_response(self):

        for col_order in self._order:
            self._filtered_result.sort(key=lambda x: x[col_order['column']], reverse=col_order['dir'] == 'desc')

        return json.dumps({
            'draw': self._draw,
            'recordsTotal': len(self._queryset),
            'recordsFiltered': len(self._filtered_result),
            'data': self._filtered_result[self._start:self._start + self._length]
        })
