import yaml


def validate_yaml(stream):

    try:

        yaml.load(stream)

    except yaml.YAMLError as e:

        return ''.join(['YAML error: ', e.problem, ' (line ', str(e.problem_mark.line),
                        ', column ', str(e.problem_mark.column), ')'])

    else:

        return True


file_types = {
    'any': {
        'ext': [],
        'validator': lambda: True,
        're': '[^\/]*'
    },
    'yaml': {
        'ext': ['.yml', '.yaml'],
        'validator': validate_yaml,
        're': '[^\/]*\.(yml|yaml)'
    }
}

mime_types = {
    'editable': [
        '^text\/.*',
        '.*\/xml$',
        '.*\/json$',
        '^inode\/x-empty$',
    ],
    'archive': [
        '.*\/zip$',
        '.*\/gzip$',
        '.*\/x-tar$',
        '.*\/x-gtar$'
    ]
}