#!/usr/bin/env bash

echo 'search m2m.cloud' >> /etc/resolv.conf
apt-get update
debconf-set-selections <<< 'mysql-server mysql-server/root_password password battuta'
debconf-set-selections <<< 'mysql-server mysql-server/root_password_again password battuta'
apt-get install -y build-essential python-dev mysql-server libmysqlclient-dev libssl-dev libffi-dev nodejs npm git
npm install -g  bower
ln -s /vagrant/etc/ansible /etc/ansible
ln -s /usr/bin/nodejs /usr/bin/node
curl -sL https://bootstrap.pypa.io/get-pip.py | sudo -E python -
pip install -r /opt/battuta/requirements.txt
mysql -u root -pbattuta --execute='CREATE DATABASE battuta;'
mysql -u root -pbattuta --execute='GRANT ALL PRIVILEGES ON battuta.* TO "battuta"@"%"  IDENTIFIED BY "battuta";'
cd /opt/battuta
bower install --allow-root
./manage.py migrate
echo "from django.contrib.auth.models import User; User.objects.create_superuser('admin', None, 'admin')" | ./manage.py shell