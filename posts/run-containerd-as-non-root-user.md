---
date: 2024-03-26
title: Run containerd service as non-root user
tags:
- containerd
- cloudnative
description: install containerd service and when run as non-root user base on default configure make some issues
---
# Run containerd as non-root user
## Binary installation
Download the binary package and create the non-root group and user for containerd
```bash
wget https://github.com/containerd/containerd/releases/download/v1.7.14/containerd-1.7.14-linux-amd64.tar.gz
tar zxf containerd-1.7.14-linux-amd64.tar.gz 
sudo mv bin/* /usr/local/bin/
sudo groupadd containerd
sudo useradd -g containerd -s /bin/false containerd
```
Creat the systemd service files
```bash
sudo vim /etc/systemd/system/containerd.service
[Unit]
Description=containerd container runtime
Documentation=https://containerd.io
After=network.target
[Service]
User=containerd
Group=containerd
ExecStart=/usr/local/bin/containerd
Restart=always
StartLimitInterval=0
StartLimitBurst=3
Delegate=yes
KillMode=process
[Install]
WantedBy=multi-user.target

sudo systemctl daemon-reload
sudo systemctl start containerd
sudo systemctl enable containerd
```

## Generate default configuration file and setting systemd service
Generate default configuration file,use
```bash
containerd config default > /etc/containerd/config.toml
```
the uid and gid are both set to 0 in the default config.toml, it means that containerd is configured to run as the root user and group, which is not suitable for running containerd as a non-root user.  
To configure containerd to run as a non-root user, you need to change these settings in the config.toml file.  
Here's how you can adjust the config.toml to specify a non-root user and group:

modify the config.toml file for editing  
Update the uid and gid parameters to specify the desired non-root user and group. For example:
```bash
[plugins."io.containerd.grpc.v1.cri".containerd]
  uid = 1000
  gid = 1000
```
Replace 1000 with the actual UID and GID of the non-root user and group you want to use.  
Restart the containerd service for the changes to take effect:  
```bash
sudo systemctl restart containerd
```
After restarting containerd, it should run using the specified non-root user and group as configured in the config.toml file.   
Make sure that the non-root user has the necessary permissions to access the required resources such as sockets, directories, etc., as mentioned in the previous response.
  * `/run/containerd/containerd.sock`
  * `/var/lib/containerd`
  * `/etc/containerd`  
You can use the chown and chmod commands to adjust ownership and permissions accordingly:
```bash
sudo chown -R <non-root-user>:<group> /run/containerd /var/lib/containerd /etc/containerd
sudo chmod g+rwX /run/containerd /var/lib/containerd /etc/containerd
```

<Comment />


