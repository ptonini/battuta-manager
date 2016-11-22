import json


def parse_datatable_serverside_request(request_data):

    data = {
        'draw': int(request_data['draw']),
        'start': int(request_data['start']),
        'length': int(request_data['length']),
        'search': {
            'value': request_data['search[value]'],
            'regex': request_data['search[regex]'] == 'true',
        },
        'order': list(),
        'columns': list()
    }

    index = 0
    while True:
        if 'order[' + str(index) + '][column]' in request_data:
            data['order'].append({
                'column': int(request_data['order[' + str(index) + '][column]']),
                'dir': request_data['order[' + str(index) + '][dir]']
            })
        else:
            break
        index += 1

    index = 0
    while True:
        if 'columns[' + str(index) + '][data]' in request_data:
            data['columns'].append({
                'data': int(request_data['columns[' + str(index) + '][data]']),
                'name': request_data['columns[' + str(index) + '][name]'],
                'orderable': request_data['columns[' + str(index) + '][orderable]'] == 'true',
                'searchable': request_data['columns[' + str(index) + '][searchable]'] == 'true',
                'search': {
                    'value': request_data['columns[' + str(index) + '][search][value]'],
                    'regex': request_data['columns[' + str(index) + '][search][regex]'] == 'true',
                },
            })
        else:
            break
        index += 1

    print json.dumps(data, indent=4)

    return
