# -*- mode: ruby -*-
# vi: set ft=ruby :

# Vagrantfile API/syntax version. Don't touch unless you know what you're doing!
VAGRANTFILE_API_VERSION = "2"

Vagrant.configure(VAGRANTFILE_API_VERSION) do |config|
  config.vm.box = "debian/contrib-stretch64"
  config.vm.network :forwarded_port, guest: 8000, host: 8001
  config.vm.hostname = "battuta-server"
  config.vm.synced_folder ".", "/vagrant", disabled: true
  config.vm.synced_folder ".", "/opt/battuta"
  config.vm.synced_folder "extras/ans_data", "/opt/ans_data"
  config.vm.synced_folder "extras/etc/ansible", "/etc/ansible"
  config.vm.provision :shell, path: "extras/scripts/bootstrap.sh"
  # config.vbguest.auto_update = false
end

