# Build paths inside the project like this: os.path.join(BASE_DIR, ...)
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/1.8/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'i^12*307fk^lm#^r_@)dvdmzy$b9*+2*s-630ith=g$!=rkfkb'


# Application definition
INSTALLED_APPS = (
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'main',
    'apps.inventory',
    'apps.users',
    'apps.runner',
    'apps.preferences'
)

MIDDLEWARE_CLASSES = (
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.auth.middleware.SessionAuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'django.middleware.security.SecurityMiddleware',
)

ROOT_URLCONF = 'main.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR, 'main/templates')],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

# Sessions
SESSION_EXPIRE_AT_BROWSER_CLOSE = True

# Internationalization
# https://docs.djangoproject.com/en/1.8/topics/i18n/

LANGUAGE_CODE = 'en-us'

TIME_ZONE = 'UTC'

USE_I18N = True

USE_L10N = True

USE_TZ = True


# Static files (CSS, JavaScript, Images)
# https://docs.djangoproject.com/en/1.8/howto/static-files/

STATIC_URL = '/static/'
STATICFILES_DIRS = (os.path.join(BASE_DIR, 'static'),)

LOGIN_URL = '/'

DATA_DIR = '/opt/ans_data'
FILE_DIR = os.path.join(DATA_DIR, 'files')
PLAYBOOK_DIR = os.path.join(DATA_DIR, 'playbooks')
USERDATA_DIR = os.path.join(DATA_DIR, 'userdata')

DEFAULT_PREFERENCES = [
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
                'name': 'ansible_server',
                'value': '127.0.0.1',
                'data_type': 'str',
                'description': 'Ansible server address'
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
            },
            {
                'name': 'single_job_window',
                'value': 'no',
                'data_type': 'bool',
                'description': 'Open jobs in single window'
            }
        ]
    },
    {
        'name': 'AWS',
        'description': '',
        'items': [
            {
                'name': 'aws_group',
                'value': 'datacenter-aws',
                'data_type': 'str',
                'description': '',
            },
            {
                'name': 'use_ec2_facts',
                'value': 'yes',
                'data_type': 'bool',
                'description': '',
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
    },
    ]


