#!/usr/bin/env bash

cd /home/ptonini/Documentos/Projetos/battuta-manager

vagrant ssh -c '/opt/battuta/manage.py runserver 0.0.0.0:8000 2>&1'