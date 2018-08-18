#!/usr/bin/env bash

apt update
apt -y upgrade
apt -y install curl
curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
curl -sL https://bootstrap.pypa.io/get-pip.py | sudo -E python -
debconf-set-selections <<< 'mysql-server mysql-server/root_password password battuta'
debconf-set-selections <<< 'mysql-server mysql-server/root_password_again password battuta'
apt install -y build-essential python-dev mariadb-server libmariadbclient-dev-compat libssl-dev libffi-dev git nodejs libcurl4-openssl-dev
pip install requests
pip install -r /opt/battuta/requirements.txt
npm install -g bower
bower install --allow-root
mysql -u root -pbattuta --execute='CREATE DATABASE battuta;'
mysql -u root -pbattuta --execute='GRANT ALL PRIVILEGES ON battuta.* TO "battuta"@"%"  IDENTIFIED BY "battuta";'
cd /opt/battuta
./manage.py migrate