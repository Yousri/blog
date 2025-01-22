---
date: 2024-02-29
title:  调研基于 IIS 的 dotnet 项目接入现有 CI/CD 的方式
tags:
- dotnet
- .NET
- CI/CD
- IIS
- Windows
description: 有个业务项目使用是古老的 .NET core 2.0 实现的，依赖部署在 Windows系统的 IIS 服务上，希望接入目前已有再用的基于 linux 的 ci/cd 工作流中
---
# 调研 IIS 的 dotnet 项目 CI/CD 的可行性

## 目前 .NET 项目发布流程
* 构建和发布是在本地环境完成的，这两个步骤不在服务器执行；
* 部署方式是直接拷贝复制文件到远端服务器站点目录；
## 需求预期接入 Jenkins 的 CI/CD 来实现完成
* 在 Jenkins 的 CI 实现完成目前在本地执行的构建和发布任务，主要需新增 .NET / .NET Core 构建依赖环境配置；
* 将 CI/CD 产生的站点程序服务 CD 部署到远程 Windows 系统 IIS 服务的站点里；
目前所用版本 .NET Core 2.0 

## 实现方案大致逻辑
### CI / CD 构建/发布环节方案：（这过程因不同环节实现方式而不同）
- 直接使用目前 Jenkins 的 master/ slave 的资源（linux系统）构建，可新增配置 .net 依赖环境配置；（验证可支持，发布生成后的文件是否兼容Windows 未验证；）
- 额外新增一台 Windows 系统环境作为 slave 资源专门用来做 CI / CD （没资源未测试）
- 直接在服务器上走整个构建发布和部署，整合封装为脚本触发执行（不符理念，且入侵性太强，个人不建议）
### CD 这里是 部署
- 通过 ssh 方式将上面 CI/CD 第 1 种方式生成的文件打包分发到目标服务器做部署；
- 通过命令工具方式维护 IIS 站点管理的基本操作；（ IIS 这个工具还需要进一步调研查看确认）

## Jenkins CI/CD 环境配置准备
### 第一步需要在目前 Jenkins 的 CI 构建系统 ubuntu 安装配置 .NET SDK 构建环境并强制额外安装 2.1 版本的运行时支持目前业务程序所需的发布运行时环境；  
注意：需要额外多安装 2.1 版本的 runtime 到较新版本 sdk 的 shared 目录下  
Ubuntu 22.04 系统环境下安装
```bash
# .Net Core 2.1
wget --no-check-certificate -O dotnet-2.1.tar.gz https://download.visualstudio.microsoft.com/download/pr/5797d98a-8faf-472d-925c-931ac542d3c8/e48942da88f4d9d653a7b5c0790e7724/dotnet-sdk-2.1.818-linux-x64.tar.gz
# .Net Core 6.0
wget --no-check-certificate -O dotnet-6.0.tar.gz https://download.visualstudio.microsoft.com/download/pr/8828b97b-7bfd-4b1b-a646-e55bddc0d7ad/e2f7d168ad273e78fbae72ffb6d215d3/dotnet-sdk-6.0.419-linux-x64.tar.gz

mkdir /usr/dotnet2.1
tar zxf dotnet-2.1.tar.gz -C /usr/dotnet2.1
ln -s /yousri/dotnet2.1/dotnet /usr/bin/dotnet2.1

mkdir /usr/dotnet6.0
tar zxf dotnet-6.0.tar.gz -C /usr/dotnet6.0
ln -s /yousri/dotnet6.0/dotnet /usr/bin/dotnet6.0
cp -rf /usr/dotnet2.1/shared/Microsoft.NETCore.App/2.1.30 /usr/dotnet6.0/shared/Microsoft.NETCore.App/

apt-get install -y libunwind8 apt-transport-https

dotnet6.0 --info
dotnet6.0 --list-runtimes
dotnet6.0 publish --help

dotnet2.1 --info
dotnet2.1 publish --help
# 可能提示错误：
No usable version of the libssl was found
```
问题解惑： 因为 dotnet 2.0 版本太老了，依赖于 openssl 1.0，目前很多 ubuntu 已经不支持 openssl 1.0 版本，所以至少需要安装 dotnet 3.1 （因为 2 版本开始依赖的是 openssl 1.0 / 1.1之类）  
安装 openssl 1.0
```bash
wget http://archive.ubuntu.com/ubuntu/pool/main/o/openssl1.0/libssl1.0.0_1.0.2n-1ubuntu5_amd64.deb
dpkg -i libssl1.0.0_1.0.2n-1ubuntu5_amd64.deb
```
### 第二个需要 Jenkins 的 master / slave 满足将上面 CI/CD 产生的站点程序文件同步部署服务到远程 Windows 系统环境的 IIS 服务的 web 站点；
* Windows Server 安装并配置开启 OpenSSH 服务功能  
  这样才能满足 Jenkins 的 CI/CD 时通过 SSH 方式远程操作 Windows 系统部署相关服务；  
  ```bash
  # 下载 OpenSSH 并解压到 C:\OpenSSH
  https://github.com/PowerShell/Win32-OpenSSH/releases/download/v9.5.0.0p1-Beta/OpenSSH-Win64.zip
  # 管理员身份打开 cmd 进入到 OpenSSH 目 安装
  cd C:\OpenSSH
  powershell.exe -ExecutionPolicy Bypass -File install-sshd.ps1
  # 设置防火墙放开允许 ssh 的默认端口 22（这个端口后面也可以修改配置文件为非默认）
  netsh advfirewall firewall add rule name=sshd dir=in action=allow protocol=TCP localport=22
  # 手动启动 sshd 服务，开启 OpenSSH 服务功能
  net start sshd
  # 管理员身份打开 powershell 设置开机自启动 OpenSSH 相关服务
  Set-Service sshd -StartupType Automatic; Set-Service ssh-agent -StartupType Automatic; Start-Service sshd; Start-Service ssh-agent
  ```
* 安装 IIS 服务
  ```bash
  #powershell 安装 IIS
  Install-WindowsFeature -name Web-Server -IncludeManagementTools
  # appcmd 管理工具
  appcmd /?
  appcmd add site /name:domain.name /id:100 /bindings:http://*:80 /physicalpath:"C:\website\domain.name"
  appcmd add app
  ```

## 业务项目构建脚本
```bash
git clone
cd SmallParcel.Shipment.Api
dotnet publish -o /var/lib/jenkins/workspace/smallparcel.api
```
本质问题是：  
必要条件是：IIS 需要有能运行接口的插件（即依赖的 ASP.net Core Module 组件模块）是 dotnet-hosting，这个目前只能根据业务接口实际依赖 .net 版本而手动下载安装不同版本的 dotnet-hosting，如这里的2.0.9版本  
```bash
#下载链接地址
https://dotnet.microsoft.com/zh-cn/download/dotnet/thank-you/runtime-aspnetcore-2.0.9-windows-hosting-bundle-installer
# 实际安装文件地址
https://download.microsoft.com/download/3/a/3/3a3bda26-560d-4d8e-922e-6f6bc4553a84/DotNetCore.2.0.9-WindowsHosting.exe
# cmd 或 powershell 执行安装
DotNetCore.2.0.9-WindowsHosting.exe

```

## 定制服务环境系统镜像（包括基础应用软件及服务）
* OpenSSH 服务
* IIS 服务
* .NET Core 托管捆绑包即dotnet-hosting  （包括 AspNetCoreModule & AspNetCoreModuleV2）
* 7zip / Notepad++ 等软件

## 参考地址

[IIS部署.net core站点](https://blog.csdn.net/weixin_45025876/article/details/133775482)
