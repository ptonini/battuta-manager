#!/usr/bin/env bash

update-alternatives --install /usr/bin/python python /usr/bin/python2 1
update-alternatives --install /usr/bin/python python /usr/bin/python3 2
debconf-set-selections <<< 'mysql-server mysql-server/root_password password battuta'
debconf-set-selections <<< 'mysql-server mysql-server/root_password_again password battuta'
apt update
apt install
#apt -y upgrade
apt -y install curl software-properties-common dirmngr
apt-key adv --recv-keys --keyserver keyserver.ubuntu.com 0xF1656F24C74CD1D8
add-apt-repository 'deb [arch=amd64,i386,ppc64el] http://mirror.ufscar.br/mariadb/repo/10.3/debian stretch main'
curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
curl -sL https://bootstrap.pypa.io/get-pip.py | sudo -E python -
apt install -y build-essential python3-dev mariadb-server libmariadbclient-dev-compat libssl-dev libffi-dev git nodejs libcurl4-openssl-dev
apt remove -y python3-httplib2 python3-pycurl
apt autoremove
pip install requests
pip install mysqlclient
pip install -r /opt/battuta/requirements.txt
npm install -g bower
mysql -u root -pbattuta --execute='CREATE DATABASE battuta;'
mysql -u root -pbattuta --execute='GRANT ALL PRIVILEGES ON battuta.* TO "battuta"@"%"  IDENTIFIED BY "battuta";'
cd /opt/battuta
bower install --allow-root
./manage.py migrate