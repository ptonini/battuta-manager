import copy

from django.conf import settings

default_prefs = [
    {
        'name': 'Global preferences',
        'description': '',
        'items': [
            {
                'name': 'hostname',
                'value': 'localhost',
                'data_type': 'str',
                'description': 'Server hostname'
            },
            {
                'name': 'date_format',
                'value': '%Y-%m-%d %H:%M:%S',
                'data_type': 'str',
                'description': 'Date format'
            },
            {
                'name': 'default_timezone',
                'value': 'America/Sao_Paulo',
                'data_type': 'str',
                'description': 'Default timezone'
            },
            {
                'name': 'password_placeholder',
                'value': '__hidden__',
                'data_type': 'str',
                'description': ''
            }
        ]
    },
    {
        'name': 'Node list',
        'description': '',
        'items': [
            {
                'name': 'node_list_min_columns',
                'value': '1',
                'data_type': 'number',
                'description': 'Minimum columns for open node list',
            },
            {
                'name': 'node_list_max_columns',
                'value': '5',
                'data_type': 'number',
                'description': 'Maximum columns for open node list',
            },
            {
                'name': 'node_list_break_point',
                'value': '5',
                'data_type': 'number',
                'description': 'Open node list column break point',
            },
            {
                'name': 'node_list_max_column_width',
                'value': '30',
                'data_type': 'number',
                'description': '',
            }
        ],
    },
    {
        'name': 'Node list (Modal)',
        'description': '',
        'items': [
            {
                'name': 'node_list_modal_min_columns',
                'value': '3',
                'data_type': 'number',
                'description': 'Minimum columns for modal node list',
            },
            {
                'name': 'node_list_modal_max_columns',
                'value': '6',
                'data_type': 'number',
                'description': 'Maximum columns for modal node list',
            },
            {
                'name': 'node_list_modal_break_point',
                'value': '9',
                'data_type': 'number',
                'description': 'Modal node list column break point',
            },
            {
                'name': 'node_list_modal_max_column_width',
                'value': '100',
                'data_type': 'number',
                'description': '',
            }
        ],
    },
    {
        'name': 'Relation list',
        'description': '',
        'items': [
            {
                'name': 'relation_list_min_columns',
                'value': '1',
                'data_type': 'number',
                'description': 'Minimum columns for relation list',
            },
            {
                'name': 'relation_list_max_columns',
                'value': '5',
                'data_type': 'number',
                'description': 'Maximum columns for relation list',
            },
            {
                'name': 'relation_list_break_point',
                'value': '5',
                'data_type': 'number',
                'description': 'Relation list column break point',
            },
            {
                'name': 'relation_list_max_column_width',
                'value': '30',
                'data_type': 'number',
                'description': '',
            }
        ],
    },
    {
        'name': 'Truncate large responses',
        'description': '',
        'items': [
            {
                'name': 'truncate_responses',
                'value': 'yes',
                'data_type': 'bool',
                'description': '',

            },
            {
                'name': 'truncate_msg',
                'value': 'truncated_by_battuta',
                'data_type': 'str',
                'description': '',

            },
            {
                'name': 'truncated_keys',
                'value': 'check_results,ansible_facts',
                'data_type': 'str',
                'description': '',
            }
        ],
    }
]

class DefaultPreferences:

    def __init__(self):
        self._items = [item for item_group in default_prefs for item in item_group['items']]

    def get_value(self, name):
        for item in self._items:
            if item['name'] == name:
                return item['value']
        return None

    def boolean_items(self):
        return [item['name'] for item in self._items if item['data_type'] == 'bool']

    def get_all(self):
        return {item['name']: item['value'] for item in self._items}
