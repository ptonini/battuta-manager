#!/usr/bin/env bash

update-alternatives --install /usr/bin/python python /usr/bin/python2 1
update-alternatives --install /usr/bin/python python /usr/bin/python3 2
debconf-set-selections <<< 'mysql-server mysql-server/root_password password battuta'
debconf-set-selections <<< 'mysql-server mysql-server/root_password_again password battuta'
apt update
apt -y install curl software-properties-common dirmngr
apt-key adv --no-tty --recv-keys --keyserver keyserver.ubuntu.com 0xF1656F24C74CD1D8
add-apt-repository 'deb http://mirror.ufscar.br/mariadb/repo/10.3/debian stretch main'
curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
curl -sL https://bootstrap.pypa.io/get-pip.py | sudo -E python -
apt install -y build-essential python3-dev mariadb-server libssl-dev libffi-dev git nodejs libcurl4-openssl-dev libsasl2-dev libldap2-dev
apt remove -y python3-httplib2 python3-pycurl
pip install requests
pip install -r /opt/battuta/requirements.txt
npm install -g bower
mysql -u root -pbattuta --execute='CREATE DATABASE battuta CHARACTER SET utf8 DEFAULT COLLATE utf8_general_ci;'
mysql -u root -pbattuta --execute='GRANT ALL PRIVILEGES ON battuta.* TO "battuta"@"%"  IDENTIFIED BY "battuta";'
cd /opt/battuta
bower install --allow-root
apt -y autoremove
./manage.py migrate