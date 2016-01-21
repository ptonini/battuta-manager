#!/usr/bin/env bash

echo 'search m2m.cloud' >> /etc/resolv.conf
echo 'battuta' > /etc/hostname
hostname battuta
apt-get update
apt-get install -y python-pip redis-server supervisor
ln -s /vagrant/etc/supervisor/conf.d/battuta.conf /etc/supervisor/conf.d/battuta.conf
ln -s /vagrant/etc/ansible /etc/ansible
pip install -r  /opt/battuta/requirements.txt
service supervisor restart

