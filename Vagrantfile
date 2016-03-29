# -*- mode: ruby -*-
# vi: set ft=ruby :

# Vagrantfile API/syntax version. Don't touch unless you know what you're doing!
VAGRANTFILE_API_VERSION = "2"

Vagrant.configure(VAGRANTFILE_API_VERSION) do |config|
  config.vm.box = "ubuntu/trusty64"
  config.vm.network :forwarded_port, guest: 8000, host: 8000
  config.vm.network :forwarded_port, guest: 6379, host: 6379
  config.vm.hostname = "battuta"
  config.vm.synced_folder "battuta", "/opt/battuta"
  config.vm.synced_folder "ans_data", "/opt/ans_data"
  config.vm.provision :shell, path: "initial_config.sh"
  config.vm.provision :shell, path: "bootstrap.sh", run: "always"
end

