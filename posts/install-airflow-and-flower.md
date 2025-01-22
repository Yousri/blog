---
date: 2024-03-10
title:  Install Airflow and Setting Flower
tags:
- airflow
- flower
- celery
description: 业务需求部署一套 Apache airflow 的任务调度服务并希望能开启配置 flower 满足通过页面查看任务状态及监控功能；
---

# Install Airflow and Setting Flower

## 初始设置 `airflow` 工作目录环境变量
```bash
cat /etc/profile.d/airflow.sh
export AIRFLOW_HOME=/app/airflow
source /etc/profile
```
## 安装依赖包
```bash
apt install pkg-config pkgconf libmysqlclient-dev python3 pip python3.10-venv
```
## 新创建 `python` 虚拟环境用于安装 `airflow` 
```bash
cd /app
python -m venv airflow
source airflow/bin/activate
# install airflow support mysql and install celery
pip install 'apache-airflow[mysql]'
pip install 'apache-airflow[redis]'
pip install 'apache-airflow[celery]'
pip install celery
```
## 调节 airflow 配置
开启后端数据持久化 `MySQL` / 队列 `redis` / 任务处理方式 `celery`
```yaml
# airflow.cfg
executor = CeleryExecutor
sql_alchemy_conn = mysql://username:passwd@db-server-ip:3306/dbname
[celery]
broker_url = redis://172.31.100.130:6379/11
celery_result_backend = redis://172.31.100.130:6379/11
```
初始化 db 数据
```bash
airflow db migrate
```
## 启动 airflow 相关功能组件服务
```bash
airflow webserver -D
airflow scheduler -D
airflow celery worker -D
airflow celery flower -a redis://172.31.100.130:6379/11 -u /flower -D
airflow users create --username Yousri --firstname Yousri --lastname Yan --role Admin --email yousri.yan@gmail.com
```
## Setting Flower service behind nginx proxy
配置 `nginx` 反向代理 `airflow webserver` 和 `flower web service`  
前面 `flower` 组件服务启动时已经设置过 `--url-prefix` 为 `/flower`
```yaml
server {
	.......

	auth_basic "Restricted";
	auth_basic_user_file /etc/nginx/conf.d/passwd;

	location / {
		proxy_pass http://airflow;
		proxy_http_version 1.1;
		proxy_set_header Upgrade $http_upgrade;
		proxy_set_header Connection "upgrade";
		proxy_set_header Host $host;
		proxy_redirect off;
                proxy_set_header   X-Real-IP        $remote_addr;
                proxy_set_header   X-Forwarded-For  $proxy_add_x_forwarded_for;
	}

	location /flower/ {
		#rewrite ^/flower/(.*)$ /$1 break;
		proxy_pass http://flower/flower/;
		proxy_http_version 1.1;
		proxy_set_header Upgrade $http_upgrade;
		proxy_set_header Connection "upgrade";
		proxy_set_header Host $host;
		proxy_redirect off;
                proxy_set_header   X-Real-IP        $remote_addr;
                proxy_set_header   X-Forwarded-For  $proxy_add_x_forwarded_for;
	}
}
```
因为使用 `airflow flower` 命令来启动管理 `Flower` 组件，所以没有使用其自身的 `auth` 用户认证配置  
而 `airflow` 本身配置文件内貌似也没有这个配置选项，感觉不太安全，故还是全部都直接配置 `nginx` 的 `basic_auth` 开启访问认证；  
其实 `flower` 命令行启动是支持指定的 [basic\_auth](https://flower.readthedocs.io/en/latest/auth.html)  

## 参考资料
[airflow config](https://airflow.apache.org/docs/apache-airflow/stable/configurations-ref.html)  
[celery](https://airflow.apache.org/docs/apache-airflow/stable/core-concepts/executor/celery.html)  
[stackoverflow](https://stackoverflow.com/questions/51941475/running-flower-behind-a-reverse-proxy)  
[running flower behind reverse proxy](https://flower.readthedocs.io/en/latest/reverse-proxy.html)  
[nginx配置代理 airflow 和 flower](https://xubiaosunny.top/post/airflow_nginx_proxy.html)

