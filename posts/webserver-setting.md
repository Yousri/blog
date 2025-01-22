---
date: 2023-11-24
title:  随记日常一些有关 Webserver 配置
tags:
- nginx
- apache
- php
description: 日常处理需求遇到的一些有关 web server （包括如古老 Apache 或主流 Nginx等）配置相关的调节需要，随手记录备忘哪天如有遇到类似查询所需；
---
# 随记一些在日常需求中遇到有关 web server 的配置
## **Nginx Upstream Header Buffer 相关**
业务研发反馈 nginx （fastcgi php） 返回 502 错误，看了一下日志如下：
::: warning
upstream sent too big header while reading response header from upstream
:::

明显是因为 header 头过大，因为 Nginx 默认通常基本就 4k / 8k 左右（因系统而已），“上游”可能有不同应用（如proxy / fastcgi /uwsgi）可以适当设置一下相应的 `*_buffers` 和 `*_buffer_size` 以使适当的缓冲区更大，如这里的 PHP 的 fastcgi
```nginx
*_buffers 16 32k;
*_buffer_size 64k;
*_busy_buffers_size 64k;

#php fastcgi buffer
fastcgi_buffers 32 32k;
fastcgi_buffer_size 128k;
```

## **关于跨域问题配置相关**
前端页面有需求通过 Ajax 下载图片资源，反馈需要增加文件存储服务（如图片资源）支持允许跨域访问（指定某个或某些域名），因为默认是不允许，为了防止被盗链之类，通常会配置限制指定域名；

Nginx 可以新增类似如下配置支持
```nginx
map $http_origin $allow_origin {
    ~^https?://(blog\.)?yousri\.org$ $http_origin;
    ~^https?://(log\.)?yousri\.org$ $http_origin;
    default "";
}
server {
    ...
    location / {
      try_files $uri $uri/ /index.php;
      if ($request_method = 'OPTIONS'){
          add_header Access-Control-Allow-Methods *;
          add_header Access-Control-Allow-Credentials true;
          add_header Access-Control-Allow-Origin $http_origin;
          add_header Access-Control-Allow-Headers $http_access_control_request_headers;
          return 200;
      }
      if ($allow_origin != "") {
          add_header 'Access-Control-Allow-Origin' $allow_origin;
          add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
          add_header 'Access-Control-Allow-Credentials' 'true';
      }
    }
}
```
这里使用了map指令来定义一个变量$allow\_origin，它根据请求中的$http\_origin来匹配允许的域名，也可以直接使用正则表达式来匹配允许的域名
``` nginx
server {
    ...
    location / {
        if ($http_origin ~* "^https?://(blog\.yousri\.org|log\.yousri\.org)$") {
            add_header 'Access-Control-Allow-Origin' "$http_origin";
        }
        ...
    }
    ...
}
```
##  **结合配置下载站 备注下 location / root / alias 关系**
location 和 root 组合可以理解为在 root 指定目录下进行 location 匹配，location 所匹配内容必须保证在 root 指定目录的子目录，否则配置无效，而且 location 只能向下匹配，不能匹配 location 指定目录上一级目录中的内容。
```nginx
        location ^~ /android/client {
                root   /app;
                if ($request_filename ~* ^.*?\.(pdf|rar|gz|zip|apk|ipa|plist)$){
                        add_header Content-Disposition: 'attachment;';
                }
	}
```
这里需要确保 /app 目录下有 location 所要匹配的目录存在，即 /app/android/client 目录存在，否则将匹配失败文件不存在的问题；

location 与 alias 组合，需要保证 location 匹配目录与 alias 指定目录级别相同，否则配置无效，与 location 和 root 组合相同的是，location所匹配内容也只能向下匹配。
```nginx
        location ^~ /android/client {
                alias   /app/android/;
                if ($request_filename ~* ^.*?\.(pdf|rar|gz|zip|apk|ipa|plist)$){
                        add_header Content-Disposition: 'attachment;';
                }
	}
```

上面两种方式的配置，请求同一个 URL 地址，如请求 `http://abc.com/android/client/abc.apk` 访问文件时，实际的区别主要是：

使用 root 配置情况下，请求到在服务器上的文件路径实际是 /app/android/client/abc.apk;

而如果使用 alias 配置时，请求到在服务器上文件路径实际情况其实是 /app/android/abc.apk;

::: tip
使用 alias ，目录名后面一定要加 “/”;
alias 只能在location中使用;
:::

## **关于反向代理功能配置相关**
* Proxy 配置允许最大上传配置
```nginx
client_max_body_size 256m;
```
::: tip
这个参数需要重启 nginx 才可生效，reload 是无法生效
:::

* 推荐用 Content-Security-Policy 替代 X-Frame-Options
```nginx
#add_header X-Frame-Options SAMEORIGIN;
add_header Content-Security-Policy: "frame-ancestors 'self' https://*.your-domain.com https://*.yousri-domain-2.com;";
```
* Nginx 当 proxy 使用重写到后端服务 `HOST` 头域名时解析域名的逻辑
```nginx
proxy_set_header Host dev.yousri.org;
``` 
在启动或重载配置时解析域名为 IP 地址，并将解析结果缓存，以避免在每次请求中重复进行 DNS 查询:  
** DNS 解析时间：  
当 Nginx 读取配置文件时（启动或重载时），会解析域名并将其解析为 IP 地址。  
如果解析成功，Nginx 缓存该结果并使用此 IP 地址处理请求。  

** DNS 缓存：  
Nginx 默认不主动刷新 DNS 缓存，除非重新加载配置（nginx -s reload）。  
如果目标后端的 IP 地址发生变化，可能导致代理失败

** 动态 DNS 更新问题
如果后端服务的 IP 地址可能会动态变化（例如使用云服务或负载均衡），Nginx 默认的静态 DNS 解析机制可能无法及时更新,可以使用以下配置解决：  
配置 resolver 指令  
Nginx 提供了 resolver 指令，用于动态 DNS 解析，允许在运行时重新解析域名：
```nginx
http {
    resolver 8.8.8.8 valid=10s;  # 指定 DNS 服务器，缓存时间为 10 秒
    resolver_timeout 5s; # 超时时间
}
```

## Apache
业务层面原本希望在入口 Haproxy 增加一个配置， 当一个请求 如果有 x-request-id 这个请求头， 则代理的时候也需要把这个请求头传递下去， 如果没有 则 haproxy 用  uuid() 创建一个，然后传递下去。Haproxy access log 需要显示 这个 x-request-id;

因为实际环境中目前 Haproxy 配置使用的模式 TCP，只做 4 层转发功能，并非 7 层转发代理；

遂要在请求入口生成 uuid 作为 trace id 只能在 Apache 层面生成;

所以只能使用 Apache 的 unique\_id 模块来实现唯一的 uuid，后端可通过 HTTP\_X\_REQUEST\_ID 获取（或通过默认的 UNIQUE\_ID 值获取）；
```apache
a2enmod unique_id
service restart apache2
## mod_unique_id 生成的token放入环境变量 UNIQUE_ID, 可通过 %{UNIQUE_ID}e 打印 Log Format
#set conf add 
<IfModule unique_id_module>
    SetEnvIf X-Request-Id "^$" no_request_id
    RequestHeader set X-Request-Id %{UNIQUE_ID}e env=no_request_id
</IfModule>
#set conf add header
<IfModule mod_headers.c>
    Header add x-request-id %{UNIQUE_ID}e
</IfModule>
```

<Comment />


