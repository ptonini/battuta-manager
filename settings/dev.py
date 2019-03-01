from settings.base import *

WSGI_APPLICATION = 'settings.wsgi.application'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = ['*']

# Database
# https://docs.djangoproject.com/en/1.8/ref/settings/#databases

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'battuta',
        'USER': 'battuta',
        'PASSWORD': 'battuta',
        'HOST': 'localhost',
        'PORT': '3306',
    }
}

DATA_PATH = '/opt/ans_data'

INVENTORY_SCRIPT = os.path.join(DATA_PATH, 'extras', 'scripts', 'get_inventory.sh')

REPOSITORY_PATH = os.path.join(DATA_PATH, 'files')
ROLES_PATH = os.path.join(DATA_PATH, 'roles')
PLAYBOOK_PATH = os.path.join(DATA_PATH, 'playbooks')
USERDATA_PATH = os.path.join(DATA_PATH, 'userdata')

PLAYBOOK_TEMPLATE = os.path.join(DATA_PATH, 'templates', 'playbook.yml')
ROLE_TEMPLATE = os.path.join(DATA_PATH, 'templates', 'role')
