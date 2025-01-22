---
date: 2024-01-10
title: 解锁小米路由器ssh并安装v2ray及openwrt系统 
tags :
- 路由器
- 科学上网
- v2ray
- openwrt
description: 解锁小米路由器 ssh 功能，再原固件系统上安装 v2ray 客户端配置代理实现无qiang模式的科学上网，并同时在此基础上尝试再安装 openwrt 固件配置实现双系统共存模式；
---
# 解锁小米路由器ssh并安装v2ray及openwrt系统

通过 Google 引擎搜索看了一下网上分享破解小米路由器 ssh 功能的文章中都提及一条件：需要一台已运行的 openwrt 的路由器用于运行脚本，但个人当时第一反应是：这个感觉有点类似于陷入先有鸡才有蛋，还是先有蛋才有鸡的问题，
因为要有 openwrt 路由器通常就应该就要先破解 ssh 功能，那是先有 openwrt 再才能破解 ssh 功能，还是先破解了 ssh 功能再刷有 openwrt 路由器呢？  
于是，就简单剖析看了一下需要 openwrt 路由器的这一条件实际是做什么处理动作功能的，是否有可替代的方式来实现呢；  
其实这里需要的 openwrt 路由器提供的作用大概就两点：
* 相当于 AP 功能提供 wifi 热点用于给要破解的 小米 路由器连接；
* 部署运行一个脚本，该脚本提供的功能其实只是实现提供一个webserver https 服务，供访问某特定 url 用于向该 AP 其连接下（即这里要破解的小米路由器）注入启动 ssh 功能的服务（即小米路由器自身 openwrt 系统基于 dropbear 服务来实现 ssh 功能的）；
了解后，按理其实只需要能够拥有 AP 功能提供 wifi 热点及部署提供 webserver 服务的设备系统即可，并非要求一定得是 openwrt 路由器，比如普通带有支持开热点的无线网卡的系统设备（树莓派、linux系统等）；  
理清思路后，这里个人这里选择借助闲置的树莓派开搞

## 首先需要解锁一下 ssh 功能
### 准备工作
* 准备将树莓派烧制进 ubuntu 22.04 系统；  
  这个可以参考 [Raspberry Pi 初始化系统配置](https://log.yousri.org/posts/across-to-the-world-without-gfw.html#raspberry-pi-%E5%88%9D%E5%A7%8B%E5%8C%96%E7%B3%BB%E7%BB%9F%E9%85%8D%E7%BD%AE)
* 配置开启 AP 功能提供 wifi 热点；
  参考网上作者分享的在openwrt上运行的[脚本](https://github.com/shell-script/unlock-redmi-ax3000)，解锁所需的操作可被简化为设置一个静态IP，网关为169.254.31.1的 wifi 热点，同时在网关上部署 webserver 提供能接收 POST 的 api 接口，接口路径为 `/cgi-bin/luci/api/xqsystem/token` ；
::: tip
这一步只需要提供开启 AP 热点功能 和 配置静态 IP 即可；配置静态 IP 与 Linux 的发行版有关，因为这里选择树莓派使用的是netplan。具体步骤可请参考不同 Linux 使用的网络配置方式；
:::

### 使用 hostapd 配置提供 AP 热点功能
* 安装 hostapd：
```bash
sudo apt install hostapd
```
* 创建 hostapd 热点配置文件 `/etc/hostapd/hostapd.conf` (这里使用的 SSID 为 xiaomi，密码为xiaomi123456)
```yaml
interface=wlan0
driver=nl80211
ssid=xiaomi
hw_mode=g
channel=7
wmm_enabled=0
macaddr_acl=0
auth_algs=1
ignore_broadcast_ssid=0
wpa=2
wpa_passphrase=xiaomi123456
wpa_key_mgmt=WPA-PSK
wpa_pairwise=TKIP
rsn_pairwise=CCMP
```
* 修改 /etc/default/hostapd，在里面添加一行：  
```yaml
DAEMON_CONF="/etc/hostapd/hostapd.conf"
```
* 启动 hostapd 服务  
```bash
sudo systemctl start hostapd
```


<Comment />


