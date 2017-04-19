#!/usr/bin/env bash

echo 'search m2m.cloud' >> /etc/resolv.conf
apt-get update
apt-get install -y build-essential python-dev mysql-server libmysqlclient-dev nodejs npm git
ln -s /vagrant/etc/ansible /etc/ansible
ln -s /usr/bin/nodejs /usr/bin/node
curl -sL https://bootstrap.pypa.io/get-pip.py | sudo -E python -
pip install -r  /opt/battuta/requirements.txt