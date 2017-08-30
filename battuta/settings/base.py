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
    'apps.files',
    'apps.preferences',
    'apps.projects'
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

DATA_PATH = '/opt/ans_data'
FILES_PATH = os.path.join(DATA_PATH, 'files')
ROLES_PATH = os.path.join(DATA_PATH, 'roles')
PLAYBOOK_PATH = os.path.join(DATA_PATH, 'playbooks')
USERDATA_PATH = os.path.join(DATA_PATH, 'userdata')

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
                'value': 65536,
                'data_type': 'number',
                'description': 'Maximum file size for the text editor'
            },
            {
                'name': 'show_hidden_files',
                'value': False,
                'data_type': 'bool',
                'description': 'Show hidden files and folders'
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
                'value': True,
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
        ]
    }
]


