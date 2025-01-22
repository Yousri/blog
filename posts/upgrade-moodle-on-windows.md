---
date: 2024-02-12
title: 跨多个大版本升级 Moodle
tags:
- moodle
- windows
- apache
description: 将近二十年没碰过Windows，突然接到一个需求要升级一个在线课程学习平台开源软件 Moodle 版本，部署在windows系统上的，至少6-7年前没维护过；自己一听第一反应有点懵，Windows是什么时代的？Moodle还存在着？因为自大四开始就基本没接触过Windows，而 Moodle 也是自己刚毕业（08年）那会第一份工作调研架设的第一个开源在线学习平台系统（PHP语言），当时是给公司内部销售同事培训用的；没想到如今还能遇上、存在着；
---
# Windows 系统环境情况，升级 Moodle 版本评估：
## 需求期望是 3.2 to 4.1 , 但其实线上 3.5.1 版本的，实际应该是 3.5 to 4.1
版本升级跨度太大，明确几个需求点：
- Moodle 必须一定得升级到 4.1 版本，3.9版本不够满足（服务端目前 php 版本是 7.2 版本，只能支持到 Moodle 3.9 版本，而4.0开始需要更高 php7.3 / 7.4 版本才能支持）；
- 故需要先同步迭代升级目前 php 版本到 7.4 以上;
- 要想升级到 4.1 以上版本，需要最低条件版本至少得 3.9 以上才可以，所以预估至少需要分步 2 次升级（3.5 --> 3.9 / 3.9 --> 4.1）
## 升级过程流程步骤粗略涉及包括：
- 备份站点及数据（程序代码 — moodle / 上传数据内容 — moodledata  / DB 数据 — MySQL）；
```txt
moodle程序目录，如： C:/Apache2.4/htdocs/moodle
上传数据目录，如：C:/Apache2.4/moodledata 
```
- 升级服务端 PHP 版本；
- Moodle 4.1 版本需要新增 2 个 php 扩展依赖 — sodium and exif ；
- 下载准备好 moodle 3.9 和 moodle 4.1 版本的程序包；
## 实际升级操作：（分 2 次操作，3.5—>3.9 / 3.9 —>4.1）
- 备份数据库数据 / 旧版站点程序 / 用户上传数据 （分步两次升级，故第一次升级完后先再备份一次稳妥些）
```bash
# db backup
mysqldump --default-character-set=utf8mb4 -h example.com -u myusername --password=mypassword -C -Q -e --create-options mydatabasename > moodle-database.sql
gzip moodle-database.sql
# backup moodledata
copy C:/Apache2.4/moodledata to C:/upgrade-backup-2024/moodledata
# backup moodle code
copy C:/Apache2.4/htdocs/moodle to C:/Apache2.4/htdocs/moodle.old
```
- 升级 php 版本到至少 7.4 以上（参考：https://windows.php.net/）
```yaml
# VC15 & VS16
https://aka.ms/vs/16/release/VC_redist.x64.exe
# php7.4.33 （加压到 C:/php74 即可，copy php.ini）
https://windows.php.net/downloads/releases/archives/php-7.4.33-Win32-vc15-x64.zip
# 新增开启支持 sodium 和 exif 扩展，修改 php.ini
extension=c:/php74/ext/php_exif.dll
extension=c:/php74/ext/php_sodium.dll
```
- 调节配置 Apache2.4 支持 php7.4 版本（这里需注意的点，详见参考链接4）
```yaml
# http.conf 需新增以下三行放能开启支持新版 php7.4 的 php_curl 扩展，否则 Curl 扩展会有问题
LoadFile "c:/php74/libssh2.dll"
LoadFile "c:/php74/libcrypto-1_1-x64.dll"
LoadFile "c:/php74/libssl-1_1-x64.dll"

LoadModule php7_module "C:/php74/php7apache2_4.dll"
AddHandler application/x-httpd-php .php
PHPIniDir "C:/php74"
```
- 将事先下载好的 moodle 站点程序代码到 C:/Apache2.4/htdocs/moodle 目录即可
```bash
# moodle 代码程序下载地址分别是：
https://packaging.moodle.org/stable39/moodle-3.9.25.zip
https://packaging.moodle.org/stable401/moodle-latest-401.zip
```
- 升级过程直接访问站点页面按照程序自动升级提示操作即可；

## 调节开启 https 
原先只配置 http，长远考虑顺便趁此机会调节为 https 方式，但目前架构是 moodle 部署在 apache 的 8080 端口服务上，前面 iis 配置 proxy  
当 iis 配置 https proxy 后，重新載入時發現會一直無限 303 see other，隨後会因為 redirect 太多次被瀏覽器拦截掉，故需要调节 moodle 的 config 配置新增
```yaml
$CFG->sslproxy = true;
$CFG->wwwroot   = 'https://domain-name';
```

## 参考资料
[SiteBackup](https://docs.moodle.org/401/en/Site_backup)  
[Upgrading](https://docs.moodle.org/39/en/Upgrading)  
[Moodle&PHP](http://www.syndrega.ch/blog/)  
[PHP7-Apache2-Setting](https://mesca.medium.com/curl-issue-with-php-7-x-on-apache-2-4-under-windows-10-511835be978f)  
[moodle behind reverse proxy](https://lorex.tw/?p=100)
