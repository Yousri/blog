---
date: 2024-04-28
title: 配置 ssh 用户只允许 sftp 但不能登录 
tags:
- ssh
- sftp
description: setting ssh user allow use sftp only,but can't login and use shell and so on;
---
# 配置用户只允许 sftp
配置用户只允许通过 pub key 验证方式使用 `sftp` 功能，但不允许 ssh 登录到服务器上；  

## 创建用户并设置用户组权限
```bash
groupadd sftponly
useradd -G sftponly -s /sbin/nologin -m sftpuser
chown root /home/sftpuser
chmod g+rx /home/sftpuser
```
::: tip
其中 `chmod`目的是因为 sftpuser 的`primary group`仍为sftpuser，允许group的rx权限是因为后续要把 `SSH` 的公钥放里面
:::

## 设置上传目录及 ssh pub key 验证方式
```bash
mkdir /home/sftpuser/data
chown sftpuser:sftpuser /home/sftpuser/data
mkdir /home/sftpuser/.ssh
chown sftpuser:sftpuser /home/sftpuser/.ssh
chmod 0700 /home/sftpuser/.ssh
cp authorized_keys ~sftpuser/.ssh
cd ~sftpuser/.ssh
chown sftpuser:sftpuser authorized_keys
```

## 修改 `sshd` 服务配置文件 `/etc/ssh/sshd_config`
```yaml
#vim /etc/ssh/sshd_config
#Subsystem sftp /usr/libexec/openssh/sftp-server
Subsystem       sftp    internal-sftp
Match Group sftponly
ChrootDirectory /home/%u
ForceCommand internal-sftp
AllowTcpForwarding no
```
```bash
systemctl restart sshd
```

## Test
```bash
sftp sftpuser@127.0.0.1
```

