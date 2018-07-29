# -*- mode: ruby -*-
# vi: set ft=ruby :

# Vagrantfile API/syntax version. Don't touch unless you know what you're doing!
VAGRANTFILE_API_VERSION = "2"

Vagrant.configure(VAGRANTFILE_API_VERSION) do |config|
  config.vm.box = "debian/stretch64"
  config.vm.network :forwarded_port, guest: 8000, host: 8001
  config.vm.network :forwarded_port, guest: 3306, host: 3316
  config.vm.hostname = "battuta"
  config.vm.synced_folder ".", "/vagrant", disabled: true
  config.vm.synced_folder ".", "/opt/battuta"
  config.vm.synced_folder "extras/ans_data", "/opt/ans_data"
  config.vm.provision :shell, path: "extras/bootstrap.sh"
end

