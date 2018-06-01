from base import *

WSGI_APPLICATION = 'settings.wsgi.application'

# SECURITY WARNING: don't run with debug turned on in production!
DEBUG = True

ALLOWED_HOSTS = ['localhost', '127.0.0.1', '10.0.1.172', '25.89.158.137', 'hal9000']

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
