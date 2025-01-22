---
date: 2023-07-13
title:  个人家用无障碍网络的几种常用实现机制方案
tags:
- linux
- clash
- Raspberry PI
description: 现实中个人实现家用通畅无阻没障碍网络的方法基本可归结如下三种方式:使用软路由（如r2s/r4s）配置代理🪜+ AP（普通路由器）提供无线热点；使用中高端路由器（支持刷类似 OpenWRT 系统）同时提供网关（配置代理🪜）及 AP 无线热点功能（如华硕 AC86U 之类或网件）；直接使用电脑/服务器作为旁路网关（如树莓派 Raspberry Pi 设备）+ AP（普通路由器）提供无线热点；
---
# 个人家用无障碍网络的几种常用实现机制方案
## 现实中基本可归结如下三种方式来实现
* 使用软路由（如r2s/r4s）配置代理🪜+ AP（普通路由器）提供无线热点；
* 使用中高端路由器（支持刷类似 OpenWRT 系统）同时提供网关（配置代理🪜）及 AP 无线热点功能（如华硕 AC86U 之类或网件）；
* 直接使用电脑/服务器作为旁路网关（如树莓派 Raspberry Pi 设备）+ AP（普通路由器）提供无线热点；
## 以下基于上面第三种方式介绍个配置案例
### 所需依赖涉及到的硬件及软件资源包括：
* Raspberry Pi 3b/4b 及其配件 （这里案例是基于最新 `ubuntu23.04` 版本系统）
* Clash 开源工具（ 支持`ss/vmess/socks` 等多种协议代理）
* Iptables 系统命令工具（主要用于配置实现网关及路由）
### Raspberry Pi 初始化系统配置
* 使用 [Raspberry Pi Imager](https://www.raspberrypi.com/software/) 官方工具格式化 MircoSD 卡并烧录系统（包括sd卡的格式化及 ubuntu 23.04 版本镜像在线下载写入 sd 卡）
* 烧制过程同时扩展配置系统初始化（如设置开启系统 ssh 远程管理功能、用户登录信息及网络连接 wifi 配置信息等，烧制工具配置时可使用快捷键Ctrl+Shift+X开启扩展配置功能）
* 烧制完成即可拔出 MircoSD 卡，插入树莓派，然后正常上电开机；通过 ssh 方式远程连接 IP 登录系统（系统 IP 信息需要通过事先配置使用的 WiFi 热点 路由器 后台查看获取，也可事先使用有线配置使用静态 IP 地址方式）
* ubuntu 系统基本环境初始化：
    * 修改默认源、安装基本网络工具及关闭相关服务
     ``` bash
        sudo sed -i 's/ports.ubuntu.com/mirrors.aliyun.com/g' /etc/apt/sources.list
        sudo apt install net-tools
        sudo vim /etc/systemd/resolved.conf #修改配置文件关闭系统自启动 systemd-resolve 服务
        DNSStubListener=no
        sudo systemctl stop systemd-resolve #关闭默认开启的 systemd-resolve 服务
        sudo ln -sf /run/systemd/resolve/resolv.conf /etc/resolv.conf
        sudo systemctl restart systemd-resolved.service
        sudo netstat -lntp # 可查看确认 53 端口未被占用
    ```
    * 下载 Clash 开源工具（其中 树莓派3b 是 armv7 架构的）
   ```bash
   sudo wget -c https://github.com/Dreamacro/clash/releases/download/v1.15.1/clash-linux-armv7-v1.15.1.gz
   sudo gunzip clash-linux-armv7-v1.15.1.gz
   sudo mv clash-linux-armv7-v1.15.1 /usr/local/bin/clash
   sudo chmod 755 /usr/local/bin/clash
   ```
### 开源工具 Clash 的使用及网关路由的配置
* 调节修改 Clash 配置文件及设置为系统服务并开机自启动

  首次执行 clash 命令，Clash 会自动创建 `$HOME/.config/clash/` 配置目录，并新建默认配置文件 `config.yaml` 和名为 Country.mmdb 的 GeoIP 数据库。接着修改 `config.yaml` 配置文件，如下是一个示例配置供参考：

```yaml
# config.yaml
port: 7890
socks-port: 7891
redir-port: 7892
mixed-port: 7893
ipv6: false
allow-lan: true
mode: Rule
log-level: info
external-controller: '0.0.0.0:6300'
external-ui: clash-dashboard
secret: ''
experimental:
  ignore-resolve-fail: false
dns:
  enable: true
  ipv6: false
  listen: 0.0.0.0:53
    #enhanced-mode: redir-host
  enhanced-mode: fake-ip #如果要玩netflix，需要使用fake-ip
  fake-ip-range: 198.18.0.1/16
  nameserver:
    - https://dns.alidns.com/dns-query # DNS-over-HTTPS

hosts:
  "dns.alidns.com": 223.5.5.5

# 配置节点代理服务器
proxies:
  # shadowsocks
  # 支持加密方式：
  #   aes-128-gcm aes-192-gcm aes-256-gcm
  #   aes-128-cfb aes-192-cfb aes-256-cfb
  #   aes-128-ctr aes-192-ctr aes-256-ctr
  #   rc4-md5 chacha20 chacha20-ietf xchacha20
  #   chacha20-ietf-poly1305 xchacha20-ietf-poly1305
  #- name: "ss"
  #  type: ss
  #  server: https.server.domain
  #  port: 443
  #  cipher: chacha20-ietf-poly1305
  #  password: "passowrd"
  #  # udp: true

  # vmess
  # 支持加密方式：auto / aes-128-gcm / chacha20-poly1305 / none
  - name: "vmess"
    type: vmess
    server: gfw.yousri.org
    port: 443
    uuid: *******
    alterId: 0
    cipher: auto
    # udp: true
    tls: true
    skip-cert-verify: true
    # servername: example.com # 优先级高于 wss host
    network: ws
    ws-path: /
    ws-headers:
      Host: gfw.yousri.org

  # socks5
  #- name: "socks"
  #  type: socks5
  #  server: server
  #  port: 443
  #  # username: username
  #  # password: password
  #  # tls: true
  #  # skip-cert-verify: true
  #  # udp: true

# 配置 Group
proxy-groups:
  # 自动切换
  - name: "auto"
    type: url-test
    proxies:
      #- http
      #- ss
      - vmess
      #- socks
    # tolerance: 150
    url: 'https://www.google.com/'
    interval: 600
  # 按需选择 - 可以在UI上选择
  - name: "netflix"
    type: select
    proxies:
      #- https01
      #- ss
      - vmess
      #- socks

rules:
# LAN
  - DOMAIN-SUFFIX,local,DIRECT
  - IP-CIDR,127.0.0.0/8,DIRECT
  - IP-CIDR,172.16.0.0/12,DIRECT
  - IP-CIDR,192.168.0.0/16,DIRECT
  - IP-CIDR,10.0.0.0/8,DIRECT

# Netflix
  - DOMAIN-SUFFIX,fast.com,netflix
  - DOMAIN-SUFFIX,api-global.netflix.com,netflix
  - DOMAIN-SUFFIX,netflix.com,netflix
  - DOMAIN-SUFFIX,netflix.net,netflix
  - DOMAIN-SUFFIX,nflxext.com,netflix
  - DOMAIN-SUFFIX,nflximg.com,netflix
  - DOMAIN-SUFFIX,nflximg.net,netflix
  - DOMAIN-SUFFIX,nflxso.net,netflix
  - DOMAIN-SUFFIX,nflxvideo.net,netflix

# 最终规则（除了中国区的IP之外的，全部翻墙）
  - GEOIP,CN,DIRECT
  - MATCH,auto
```

需要注意以下的一些配置:

::: tip
  * allow-lan: true 允许 Clash 处理来自局域网内其他设备的流量。
  * redir-port: 7792 意味着 Clash 将会监听 7792 端口以处理局域网内其他设备所转发的流量。而 port: 7790 和 socks-port: 7791 分别声明了用作 HTTP / HTTPS 和 SOCKS5 代理的端口。
  * 在 dns 中需要配置 enable: true 允许 Clash 用作 DNS 服务器，配置 enhanced-mode: fake-ip 以用于透明代理，并声明 listen: 0.0.0.0:53 以监听 53 端口。如果要绑定例如 53 等低位端口，就必须要使用 root 用户；如果使用 pi 等普通用户运行 Clash 将会出现端口绑定的权限错误。
  * 关于 dns 中的 nameserver 配置，可以使用常用的公共 DNS 如 114.114.114.114、8.8.8.8 等，也可以配置 DNS-over-HTTPS。如上面使用 https://dns.alidns.com/dns-query 即阿里 DNS 的 DoH，并且增加一条 hosts 配置 "dns.alidns.com": 223.5.5.5，这样就不需要再对 dns.alidns.com 进行解析。
:::

关于其他 proxies、proxy-groups 以及 rules 的配置，则可以根据需要自行编辑。更多 Clash 示例配置及说明可以参考 [config.yaml](https://github.com/Hackl0us/SS-Rule-Snippet/blob/6fb5c342fbe3c63a3baa4f0e8bb32046631809f6/LAZY_RULES/clash.yaml) 中的内容。

* 如果需要通过浏览器可视化地查看 Clash 运行情况，可以下载 [clash-dashboard](https://github.com/Dreamacro/clash-dashboard)

  取消注释配置文件 `config.yaml` 中的 `external-controller` 、`external-ui` 和 `secret`参数选项，并配置 `secret` 作为访问 dashboard 的口令。
  这样可以在局域网内的其他设备上开启浏览器，访问 http://ip:6300/ui/  其中 IP 即此前配置的 Pi 的 IP 地址，端口 6300 即 Clash 监听的外部控制器端口
```bash
cd $HOME/.config/clash/
git clone https://github.com/Dreamacro/clash-dashboard.git
cd clash-dashboard/
git checkout -b gh-pages origin/gh-pages
```
* 开启 Raspberry Pi 启用 IP 转发及配置 iptables 开启网关路由配置功能
  * 编辑 `/etc/sysctl.conf` 文件，将 `net.ipv4.ip_forward=0` 修改为 `net.ipv4.ip_forward=1`，然后执行 `sysctl -p` 以使配置生效。
  * 配置 iptables 并使其持久化
    在启用 IP 转发后，我们需要增加 iptables 规则对流量进行处理。通过以下命令，创建名为 CLASH 的链，将 TCP 流量转发到 7892 端口并将访问专有网络 IP 地址的流量排除其外
    ```bash
    # Create CLASH chain
    iptables -t nat -N CLASH
    # Bypass private IP address ranges
    iptables -t nat -A CLASH -d 10.0.0.0/8 -j RETURN
    iptables -t nat -A CLASH -d 127.0.0.0/8 -j RETURN
    iptables -t nat -A CLASH -d 169.254.0.0/16 -j RETURN
    iptables -t nat -A CLASH -d 172.16.0.0/12 -j RETURN
    iptables -t nat -A CLASH -d 192.168.0.0/16 -j RETURN
    iptables -t nat -A CLASH -d 224.0.0.0/4 -j RETURN
    iptables -t nat -A CLASH -d 240.0.0.0/4 -j RETURN
    # Redirect all TCP traffic to 8890 port, where Clash listens
    iptables -t nat -A CLASH -p tcp -j REDIRECT --to-ports 7892
    iptables -t nat -A PREROUTING -p tcp -j CLASH
    iptables -t nat -L # 可以查看到已添加的规则
    ```
    其中，iptables 规则可能会在 Pi 重新启动后被清空，因而需要借助 iptables-persistent 实现持久化。
    ```bash
    sudo apt install iptables-persistent netfilter-persistent
    sudo netfilter-persistent save
    ```
    运行 netfilter-persistent save 可以将刚才配置的 iptables 规则保存在 /etc/iptables/rules.v4 文件中，并会在 Pi 重新启动后自动加载，也可以使用 netfilter-persistent reload 命令手动加载到 iptables。

* 配置 Clash 为系统服务及开启开机自启动该服务
    * 创建 `/etc/systemd/system/clash.service` 文件
    ```yaml
    vim /etc/systemd/system/clash.service
    # 内容如下
    [Unit]
    Description=clash service
    After=network.target
    [Service]
    ExecStart=/usr/local/bin/clash -d /root/.config/clash/
    [Install]
    WantedBy=multi-user.target
    ```
    * `systemctl` 配置开机启动
    ```bash
    sudo systemctl daemon-reload # 刷新配置
    sudo systemctl start clash # 启动clash.service
    sudo systemctl enable clash # 设置开机启动
    ```
### 局域网内的其他设备配置网关和 DNS
最后，将局域网内需要使用无墙模式的其他设备的网关和 DNS 均配置为 Pi 的 IP 地址即可，下图以 iOS 设备为例。在浏览器中访问 http://IP:6300/ui/  可以查看到经由 Clash 处理的所有当前连接。
### 参考文档
[How to use Raspberry Pi Imager | Install Raspberry Pi OS to your Raspberry Pi](https://www.youtube.com/watch?v=ntaXWS8Lk34)

[家用旁路网关](https://haoel.github.io/#8-%E5%AE%B6%E7%94%A8%E9%80%8F%E6%98%8E%E7%BD%91%E5%85%B3)

<Comment />
