---
date: 2024-05-13
title:  实现 .NET Framework 业务项目接入 Jenkins CI/CD 到 Windows IIS
tags:
- .NET
- FrameWork
- IIS
- WebDeploy
- Web
- CI/CD
description: 在 Windows / Linux (Mono) 系统平台使用 Jenkins 实现 .Net Framework 的 CI/CD 自动化流水线部署到远程 Window 服务器的 IIS 站点上，之前调研 .NET Core 业务项目（其实后来验证可以直接采用 Docker 构建部署 ）后被其他事宜耽搁且遗落 .NET Framework 版本的，所以这次趁此验证强依赖 Windows 系统平台的 FrameWork 版本的方案后小更新一下备录下，（虽然后面大概率依旧不会再去碰 Windows 或 .NET 相关技术栈）；
---
# 实现 `.NET Framework` 业务项目接入 Jenkins CI/CD 到 Windows IIS
配置支持的相关环境/工具  
建议可考虑将不同环境的初始化定制为镜像
## Windows 系统平台的 CI Server 配置
::: tip
注意  
需要设置添加相应目录到系统环境变量中，方能直接命令行直接使用（不然就需要使用绝对路径或使用前先设置环境变量）  
如 msdeploy.exe 命令行工具进行部署远程 IIS 服务站点  
:::

### 安装 Git 客户端  
```bash
# 默认安装目录
C:\Git\bin\git.exe
```
### 安装 IIS 服务 (CI 环境 可选)  
* 需要确认安装 `管理工具`： IIS 管理脚本和工具 / 管理服务
* 需要确认开启 `服务` ： Web Management Service / Web 部署代理服务

### 安装 WebDeploy 管理工具  
```bash
# 默认安装目录
C:\Program Files (x86)\IIS\Microsoft Web Deploy V3
```
### 下载 Micorsoft C++ 生成工具 (实际是 `Visual Studio Build Tools` 安装包）  
包括 编译/构建 依赖的 `msbuild` 命令行工具 / WebApplications 等支持
```bash
# 默认安装目录
C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\MSBuild\Current\Bin\MSBuild.exe
```
### 安装 NuGet 工具
```bash
nuget.exe install NuGet.CommandLine
```
### 安装 .NET Framework 版本
不同业务项目可能依赖不同版本，需要业务方确认提供构建需要的环境版本，配置安装不同版本的 SDK 来支持；  
### WebDeploy 部署工具命令行使用
```bash
msdeploy -verb:sync -source:iisApp='wwwroot' -dest:iisapp='RMS-RTV.Presentation',computerName='https://172.18.1.2:8172/msdeploy.axd',username=user,password=password,authType='Basic' -enableRule:DoNotDeleteRule -allowUntrusted -enablerule:AppOffline -skip:objectName=filePath,absolutePath=.*web\.config
```

## Linux 系统平台的 CI Server 配置
Linux 系统下构建 `.NET FrameWork` 目前只能借助基于 [`Mono`](https://zh.wikipedia.org/wiki/Mono) 来实现构建;
因为为了方便直接使用微软官方提供的 `WebDeploy` 部署 IIS 服务，这里暂时没有验证 linux 平台构建/（scp）部署方式;

## 运行环境配置（远程服务器环境初始化）
### 安装 IIS 服务并配置站点
* 需要确认安装 `管理工具`： IIS 管理脚本和工具 / 管理服务
* 需要确认开启 `服务` ： Web Management Service / Web 部署代理服务
### 在 IIS 安装 WebDeploy 并配置开启远程代理管理服务
```bash
# 默认安装目录
C:\Program Files (x86)\IIS\Microsoft Web Deploy V3
```
配置开启服务并配置授权管理用户，可以参考 [IIS7 上安装和配置web部署](https://learn.microsoft.com/zh-cn/iis/install/installing-publishing-technologies/installing-and-configuring-web-deploy)

### 开启 站点自动备份 功能
`PowerShell` 配置自动备份脚本，以管理员身份打开 `PowerShell ISE` 编辑器，加载以下脚本执行。
```bash
#run as administrator
cd '..\..\Program Files\IIS\Microsoft Web Deploy V3\Scripts'
. .\BackupScripts.ps1
TurnOn-Backups -On $true
Configure-Backups -Enabled $true
Configure-Backups -BackupPath "{SitePathParent}\snapshots\{siteName}"
Configure-Backups -ContinueSyncOnBackupFailure $false
Configure-Backups -NumberOfBackups 5
pause
```

## Jenkins 项目设置

可参考 [BPN-Stage-APIV1](http://jenkins-dev.item.com/job/BNP-Stage-ApiV1/) 项目目前的配置按需修改构建情况；

### 安装初始项目依赖包
通过 Windows 批处理使用 `NuGet` 工具安装
```bash
# 设置兼容 Jenkins 控制台显示 windows 系统的中文编码
chcp 65001
# 手动设置环境变量
set PATH=%PATH%;C:\nuget\NuGet.CommandLine.6.9.1\tools\
# 如果有其他模块或目录依赖包需要全部配置安装，引用方式验证过并不能递归安装，如：
nuget restore %WORKSPACE%\WebAPI\WebAPI.csproj -SolutionDirectory %WORKSPACE%
nuget restore %WORKSPACE%\Common\Common.csproj -SolutionDirectory %WORKSPACE%
nuget restore %WORKSPACE%\Model\Model.csproj -SolutionDirectory %WORKSPACE%
```
### 使用 Jenkins 的 MSBuild 插件构建 .NET 项目

### 使用 Web Deploy 命令行工具进行部署远程 IIS 站点
同样通过 windows 批处理命令即可
```bash
chcp 65001
msdeploy -verb:sync -source:iisApp='%WORKSPACE%\WebAPI' -dest:iisapp='StageApiV1',computerName='https://172.18.1.2:8172/msdeploy.axd',username=%deployuser%,password=%deploypasswd%,authType='Basic' -enableRule:DoNotDeleteRule -allowUntrusted
```
其中这里的 computerName 的配置信息是前面远程 Windows 服务器已经配置准备的 Web 部署远程服务信息；

## 相关工具下载地址
[Git Client For Windows](https://github.com/git-for-windows/git/releases/download/v2.45.0.windows.1/Git-2.45.0-64-bit.exe)  
[WebDeploy x64 Installer](https://download.microsoft.com/download/5/6/4/56418889-EAC9-4CE6-93C3-E0DA3D64A0D8/WebDeploy_amd64_zh-CN.msi)  
[NuGet CLI](https://dist.nuget.org/win-x86-commandline/latest/nuget.exe)  
[VS-BuildTools](https://aka.ms/vs/17/release/vs_BuildTools.exe)   
[.NET FrameWork SDK](https://dotnet.microsoft.com/zh-cn/download/dotnet-framework/)  

## 参考文档 
[WebDeploy](https://www.iis.net/downloads/microsoft/web-deploy)  
[VisualStudio Tools](https://visualstudio.microsoft.com/zh-hans/downloads/)  
[Mono](https://www.mono-project.com/)  
[Web部署时自动备份](https://learn.microsoft.com/zh-cn/iis/publish/using-web-deploy/web-deploy-automatic-backups)  
[IIS7 上安装和配置web部署](https://learn.microsoft.com/zh-cn/iis/install/installing-publishing-technologies/installing-and-configuring-web-deploy)  
