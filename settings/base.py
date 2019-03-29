# Build paths inside the project like this: os.path.join(BASE_DIR, ...)
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Quick-start development settings - unsuitable for production
# See https://docs.djangoproject.com/en/1.8/howto/deployment/checklist/

# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = 'i^12*307fk^lm#^r_@)dvdmzy$b9*+2*s-630ith=g$!=rkfkb'


# Application definition
INSTALLED_APPS = (
    #'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'main',
    'apps.inventory',
    'apps.iam',
    'apps.runner',
    'apps.files',
    'apps.preferences',
    'apps.projects'
)

MIDDLEWARE = (
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'django.middleware.security.SecurityMiddleware',
    'main.extras.middleware.FileDataParsingMiddleware',
    'main.extras.middleware.JSONParsingMiddleware'
)

ROOT_URLCONF = 'main.urls'

AUTH_USER_MODEL = 'iam.LocalUser'

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

CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'TIMEOUT': 3600
    },
    'authorizer': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'TIMEOUT': 3600
    }
}

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

CACHE_TIMEOUT = 30

DEFAULT_PREFERENCES = [
    {
        'name': 'Global preferences',
        'description': '',
        'items': [
            {
                'name': 'ansible_servers',
                'value': '127.0.0.1',
                'data_type': 'str',
                'description': "Ansible servers allowed to use inventory (comma separated IP's)"
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
        'name': 'Runner preferences',
        'description': '',
        'items': [
            {
                'name': 'show_empty_tasks',
                'value': True,
                'data_type': 'bool',
                'description': 'Hide empty (no hosts) tasks in result view'
            },
            {
                'name': 'single_job_window',
                'value': False,
                'data_type': 'bool',
                'description': 'Open jobs in single window'
            },
            {
                'name': 'truncate_responses',
                'value': True,
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

        ]
    },
    {
        'name': 'File manager preferences',
        'description': '',
        'items': [
            {
                'name': 'max_edit_size',
                'value': 262144,
                'data_type': 'number',
                'description': 'Maximum file size for the text editor'
            },
            {
                'name': 'show_hidden_files',
                'value': False,
                'data_type': 'bool',
                'description': 'Show hidden files and folders'
            },
            {
                'name': 'validate_content_on_read',
                'value': True,
                'data_type': 'bool',
                'description': 'Validate file content on read'
            }
        ]
    },
    {
        'name': 'AWS',
        'description': '',
        'items': [
            {
                'name': 'aws_group',
                'value': '',
                'data_type': 'str',
                'description': '',
            },
            {
                'name': 'use_ec2_facts',
                'value': False,
                'data_type': 'bool',
                'description': '',
            }
        ]
    },
    {
        'name': 'DynaGrid options',
        'description': '',
        'items': [
            {
                'name': 'node_grid_columns',
                'value': 5,
                'data_type': 'number',
                'description': 'Columns for node grid',
            },
            {
                'name': 'selection_modal_columns',
                'value': 4,
                'data_type': 'number',
                'description': 'Columns for selection modal',
            },
            {
                'name': 'user_grid_columns',
                'value': 5,
                'data_type': 'number',
                'description': 'Columns for user and user groups grid',
            },
            {
                'name': 'playbook_grid_columns',
                'value': 3,
                'data_type': 'number',
                'description': 'Columns for playbook grid',
            },
            {
                'name': 'role_grid_columns',
                'value': 3,
                'data_type': 'number',
                'description': 'Columns for role grid',
            },
        ]
    },
    {
        'name': 'Offsets',
        'description': '',
        'items': [
            {
                'name': 'outer_canvas_offset',
                'value': 25,
                'data_type': 'number',
                'description': '',
            },
            {
                'name': 'inner_canvas_offset',
                'value': 20,
                'data_type': 'number',
                'description': '',
            },
            {
                'name': 'table_offset',
                'value': 28,
                'data_type': 'number',
                'description': '',
            },
            {
                'name': 'node_selector_offset',
                'value': 23,
                'data_type': 'number',
                'description': '',
            },
        ]
    }
]


