import ldap
from django_auth_ldap.config import LDAPSearch
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

INVENTORY_SCRIPT = '/opt/battuta/extras/scripts/get_inventory.sh'

REPOSITORY_PATH = os.path.join(DATA_PATH, 'files')
ROLES_PATH = os.path.join(DATA_PATH, 'roles')
PLAYBOOK_PATH = os.path.join(DATA_PATH, 'playbooks')
USERDATA_PATH = os.path.join(DATA_PATH, 'userdata')

PLAYBOOK_TEMPLATE = os.path.join(DATA_PATH, 'templates', 'playbook.yml')
ROLE_TEMPLATE = os.path.join(DATA_PATH, 'templates', 'role')

AUTHENTICATION_BACKENDS = [
    'django.contrib.auth.backends.ModelBackend',
    'django_auth_ldap.backend.LDAPBackend',
]

AUTH_LDAP_SERVER_URI = 'ldap://10.25.51.9:389'
AUTH_LDAP_ALWAYS_UPDATE_USER = True
AUTH_LDAP_BIND_DN = 'CN=battuta,OU=Usuarios de serviços,OU=e-Xyon,DC=exyon,DC=local'
AUTH_LDAP_BIND_PASSWORD = 'K[/GtgnTt<u+X*;@F]'
AUTH_LDAP_USER_SEARCH = LDAPSearch('DC=exyon,DC=local', ldap.SCOPE_SUBTREE, 'sAMAccountName=%(user)s')
AUTH_LDAP_USER_ATTR_MAP = {'username': 'sAMAccountName', 'first_name': 'givenName', 'last_name': 'sn', 'email': 'mail'}
AUTH_LDAP_CONNECTION_OPTIONS = {ldap.OPT_DEBUG_LEVEL: 1, ldap.OPT_REFERRALS: 0}
