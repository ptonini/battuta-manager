from base import *

WSGI_APPLICATION = 'settings.wsgi.application'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = ['battuta.m2mcontrol.com.br', 'localhost', '127.0.0.1']

# Database
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': 'battuta',
        'USER': 'battuta',
        'PASSWORD': 'battuta',
        'HOST': '10.10.1.104',
        'PORT': '3306',
    }
}
