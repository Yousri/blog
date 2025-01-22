---
date: 2024-05-29
title:  关于 FTP Server 一点基础常识
tags:
- ftp
- vsftpd
- php
description: 最近日常处理客户及研发需求过程遇到的一些有关 ftp server 相关的问题时回补一些古老的 ftp 基础知识点；
---
# 科普 FTP Server 基础 （这里以基于 vsftpd 为例）

## 关于 `FTP` 的几种连接方式（**连接会话**）
- `FTP` 普通方式  
  协议 `ftp` ，默认端口 `21`  
  直连方式：`ftp://ftp.server.com`  
- `FTPS` 显式模式  
  协议 `ftps` ，默认端口 `21`（连接其实类似 `FTP` 普通方式并没加密）  
  直连方式： `ftps://ftp.server.com`  
  连接成功后再发送 `AUTH TLS` 或 `AUTH SSL` 命令才升级 `SSL/TLS` 连接方式；  
- `FTPS` 隐式模式  
  协议 `ftps` ，默认端口 `990` （从一开始就是建立加密的 `SSL/TLS` 连接，连接建立时即是加密的）  
  服务端建议配置开启 `implicit_ssl=YES` 隐式模式  
  直连方式：`ftps://ftp.server.com:990`  

**注意事项**
* 在标准配置中，就 `FTPS` 协议而言，显式 `FTPS` 通常默认使用端口 21，而隐式 `FTPS` 默认使用端口 990。所以端口 990 通常用于隐式 `FTPS`，显式 `FTPS` 通常使用端口 21，但也可以配置为使用其他端口。
* 显式 FTPS 在连接建立后通过命令升级到加密，而隐式 FTPS 从一开始就是加密的。
* 如果希望通过显式模式使用端口 990，可以进行配置，但这并不符合标准 `FTP` 规范，可能会导致客户端和服务器之间的兼容性问题。标准显式 `FTPS` 是在端口 21 上进行的。
* 经测试尝试使用显式模式连接到端口 990 的方法，从测试结果来看是服务器和客户端并不一定兼容支持这种非标准方式配置。
* 显式 `FTPS` 在非标准端口（如 990）上可能会导致一些客户端无法正确处理连接，因为他们期望在端口 990 上使用隐式 `FTPS` `，所以最好使用标准端口 21 进行显式 FTPS。

## 关于 `FTP` 的数据传输模式（**数据会话**）
前面连接只是在建立连接的会话，建连完成后会有单独额外的数据传输会话；  
FTP 数据传输模式主要有两种：主动模式（`Active Mode`）和被动模式（`Passive Mode`），这两种模式定义了数据传输过程中，客户端和服务器之间如何建立数据连接的。
- 主动模式（`Active Mode`）
这种模式下，客户端在连接上（比如端口 21 ）会告知服务器在哪个端口上监听数据连接。服务器然后从它的默认数据端口（默认端口通常 20）连接到客户端指定的数据端口,数据链路大致：
  * 客户端在连接上发送 PORT 命令，会开启一个监听的数据端口
  * 服务器从数据端口（默认端口通常 20）连接到客户端指定的端口  

这种模式就依赖客户端必须开放一个端口并允许服务器连接，这在实际用户场景的 `NAT` 网络环境下显然不现实，所以基本不会使用这种方式；

- 被动模式（`Passive Mode`）
服务器告诉客户端它在某个端口（这个默认是随机，服务端可配置，下面说明）上监听数据连接，客户端随后连接到服务器的这个端口。
  * 客户端在命令连接上发送 `PASV` 命令
  * 服务器响应并提供一个端口号，告诉客户端它在哪个端口上监听数据连接
  * 客户端随后连接到服务器指定的端口  

所以这里需要服务端新开启一个**数据会话** 用于传输数据的监听端口, 这个监听端口数据链路返回给客户端用户的 IP 默认可能是 服务端的 `私网IP` 导致访问不了，所以服务端 ftp 需要配置 `pasv_address= public ip`，客户端用户才可能传输；

## `vsftpd`配置示例及`PHP`测试示例
### 服务端 `vsftpd` 配置示例参考
```yaml
listen=YES
listen_port=21
listen_ipv6=NO
anonymous_enable=NO
local_enable=YES
write_enable=YES
local_umask=022
dirmessage_enable=YES
use_localtime=YES
xferlog_enable=YES
log_ftp_protocol=YES
connect_from_port_20=YES
chroot_local_user=YES
chroot_list_enable=YES
chroot_list_file=/etc/vsftpd.chroot_list
# 开启 ssl
ssl_enable=YES
force_local_data_ssl=YES
force_local_logins_ssl=YES
ssl_tlsv1=YES
ssl_sslv2=NO
ssl_sslv3=NO
require_ssl_reuse=NO
ssl_ciphers=HIGH
rsa_cert_file=/etc/ssl/private/vsftpd.pem
rsa_private_key_file=/etc/ssl/private/vsftpd.pem
debug_ssl=YES
# 开启被动模式
pasv_enable=YES
# 指定被动模式的端口范围
pasv_min_port=10000
pasv_max_port=10100
# ftp server 公网 IP 地址，最好设置
pasv_address= public ip
```
如果要强制使用 `隐式模式` 连接，那就微调如下配置：
```yaml
listen_port=990
implicit_ssl=YES
```
BTW: 可以考虑使用两个位置文件 `vsftpd.conf` / `vsftpd_ssl.conf` 分别开启同时支持 `ftps` 协议方式的显式/隐式模式 `ftp` 服务

### `PHP` 测试示例 
#### 借助 `cURL` 方式
```php
// FTP 服务器信息
$ftp_server = "ftp.server.com";
$ftp_port = 21;
#$ftp_port = 990;
$ftp_username = "ftpuser";
$ftp_password = "ftpuser";
$local_file = "./me.jpg";
$remote_file = "/home/ftp/me.jpg";
// 初始化 curl
$ch = curl_init();
// 设置 curl 选项
curl_setopt($ch, CURLOPT_URL, "ftp://$ftp_server:$ftp_port/$remote_file"); # 普通 ftp 协议
#curl_setopt($ch, CURLOPT_URL, "ftps://$ftp_server:$ftp_port/$remote_file"); # ftp over ssl 的 ftps 协议
curl_setopt($ch, CURLOPT_USERPWD, "$ftp_username:$ftp_password");
curl_setopt($ch, CURLOPT_UPLOAD, 1);
curl_setopt($ch, CURLOPT_FTP_SSL, CURLFTPSSL_ALL);
curl_setopt($ch, CURLOPT_FTPSSLAUTH, CURLFTPAUTH_SSL);
curl_setopt($ch, CURLOPT_INFILE, fopen($local_file, 'r'));
curl_setopt($ch, CURLOPT_INFILESIZE, filesize($local_file));
// 禁用 SSL 证书验证
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
// 使用被动模式
curl_setopt($ch, CURLOPT_FTP_USE_EPSV, true);
// 指定使用 TLSv1.2
curl_setopt($ch, CURLOPT_SSLVERSION, CURL_SSLVERSION_TLSv1_2);
// 执行上传
$result = curl_exec($ch);
if ($result !== false) {
    echo "File uploaded successfully using TLSv1.2\n";
} else {
    echo "Curl error: " . curl_error($ch) . "\n";
}
// 关闭 curl
curl_close($ch);
```
#### 默认的 `FTP`函数方式
```php
$ftp_server = "ftp.server.com";
$ftp_username = "ftpuser";
$ftp_password = "ftpuser";
$remote_file = "/home/ftp/me.jpg";
$local_file = "./me.jpg";
// 使用 ftp_ssl_connect 连接到 FTP 服务器
$conn_id = ftp_ssl_connect($ftp_server);
if (!$conn_id) {
    die("Couldn't connect to FTP server");
}
// 使用用户名和密码登录
$login_result = ftp_login($conn_id, $ftp_username, $ftp_password);
if (!$login_result) {
    ftp_close($conn_id);
    die("Couldn't login to FTP server");
}
// 设置被动模式
ftp_pasv($conn_id, true);
// 打开本地文件以读取内容
$file = fopen($local_file, 'r');
if (!$file) {
    ftp_close($conn_id);
    die("Couldn't open local file");
}
// 将本地文件上传到远程服务器
$upload_result = ftp_fput($conn_id, $remote_file, $file, FTP_BINARY);
// 关闭本地文件
fclose($file);
if (!$upload_result) {
    ftp_close($conn_id);
    die("Failed to upload file");
}
echo "File uploaded successfully\n";
// 关闭连接
ftp_close($conn_id);
```
