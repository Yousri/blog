---
date: 2024-05-26
title:  Upgrade Docker and ELK 
tags:
- docker
- elk
- elasticsearch
- kibana
description: 升级线上日志采集系统 ELK 从 7.17.6 到 8.13.4 版本，发现原先系统的 docker 版本竟然太低不支持，遂只能先顺手升级 docker 版本；
---
# 升级 ELK `7.17.6` 到 `8.13.4` 
目前使用原先是使用 `docker-compose` 部署方式;  
考虑为了保持原先的使用方式的兼容，升级后依旧保持免认证写入方式；

注意点：
* ES 没有开启安全认证的，因为 `ES 8.x` 版本**安全功能**默认是开启的，必须配置 `xpack.security.enabled=false`；
* `logstash`的`7.17.6` 和 `8.13.4` 的官方 `docker` 镜像构建依赖的 `jdk` 版本不同（`java11` VS `java17`）；  
  最好事先确认关于 `Java` 的 `jvm.options` 定制配置是否会有不兼容问题需调节  
  比如这里原先`7.17.6`镜像基于的 jdk 是`java11`版本，并且配置 `CMS` 收集器(这个`java14`之后不再使用)几个配置中相关参数配置就已不再支持；  
	```yaml
	-XX:CMSInitiatingOccupancyFraction=75
	-XX:+UseCMSInitiatingOccupancyOnly
	```
* 如果要开启安全功能即 `xpack.security.enabled=true` ，那节点间传输通信也强制得TLS/SSL 方式；  
因为这个如果调节，现状原先是没有走 ssl 通信方式，那会涉及需要新增配置证书及开启安全功能认证等，额外需要调节大量 `logstash` 的 `pipline` 处理任务配置，这里暂且先保留原有使用方式；
* ES `8.13.4` 官方 docker 镜像要求 `Docker` 版本最低至少 `18.06`以上；  

## 升级 Docker 版本
```bash
sudo systemctl stop docker.service
# 直接 apt upgrade 方式升级
sudo apt upgrade docker-ce
# 修改 docker 默认数据目录
sudo vim /etc/docker/daemon.json
{
  "data-root": "/data/docker_home"
}
sudo systemctl start docker.service
docker info
```
## 升级 ELK 版本，更新 `docker-compose` 部署文件
### 镜像拉取准备
```bash
docker pull docker.elastic.co/elasticsearch/elasticsearch:8.13.4
docker pull docker.elastic.co/kibana/kibana:8.13.4
docker pull docker.elastic.co/logstash/logstash:8.13.4
```
### 更新 `docker-compose.yaml` 文件
```yaml
version: '2'
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.13.4
    container_name: elasticsearch
    environment:
      - cluster.name=elk-cluster
      - node.name=es01
      - bootstrap.memory_lock=true
      - xpack.security.enabled=false
      #- xpack.security.transport.ssl.enabled=false
      - "ES_JAVA_OPTS=-Xms16g -Xmx16g"
      - "network.host=0.0.0.0"
      - "network.publish_host=192.168.1.110"
      - "transport.port=9300"
      #- "cluster.initial_master_nodes=es01"
      - "discovery.seed_hosts=192.168.1.111"
    ulimits:
      memlock:
        soft: -1
        hard: -1
    volumes:
      - esdata1:/usr/share/elasticsearch/data
    ports:
      - 9200:9200
      - 9300:9300
  logstash:
    image: docker.elastic.co/logstash/logstash:8.13.4
    environment:
       - "ES_JAVA_OPTS=-Xmx8196m"
    volumes:
      - /data/elasticsearch/logstash/config:/usr/share/logstash/config
      - /data/elasticsearch/logstash/pipeline:/usr/share/logstash/pipeline
      - /data/elasticsearch/logstash/logs:/usr/share/logstash/logs
      - /data/elasticsearch/logstash/grok/patterns:/data/grok/patterns
    extra_hosts:
      - "elasticsearch:192.168.1.110"
    ports:
      - 5044:5044
  kibana:
    image: docker.elastic.co/kibana/kibana:8.13.4
    environment: 
      - "ES_JAVA_OPTS=-Xmx5120m"
      - ELASTICSEARCH_URL=http://elasticsearch:9200
      - ELASTICSEARCH_REQUESTTIMEOUT=300000
      - SERVER_PUBLICBASEURL=http://192.168.1.111:5061/
    ports:
      - "5601:5601"
    depends_on:
      - elasticsearch
volumes:
  esdata1:
    driver: local
```
## 一点小问题
升级过程中 `kibana` 版本过程遇到小问题导致更新启动失败，后来查看 log 后了解到可能是因为原先的一些索引被设置为默认不允许写入引起；
```yaml
Unable to complete saved object migrations for the [.kibana_task_manager] index. Error: TRANSFORMED_DOCUMENTS_BULK_INDEX received unexpected action response: {"type":"target_index_had_write_block"}
```
按错误提示来看，`.kibana_task_manager*` 索引通常是用于存储和管理 `Kibana` 的定时任务和后台任务的状态。默认情况下，该索引正常应该允许写操作 (`"index.blocks.write": false`) 以确保 `Kibana` 能够正常运行和执行任务管理功能。  
但这里实际配置应该是被设置为 `true`，导致 `Kibana` 更新启动异常，所以这里需要手动调节设置为 `false`  
```bash
curl -XPUT 'http://localhost:9200/.kibana_task_manager_7.17.6_001/_settings' -H 'Content-Type: application/json' -d '{
"index": {
   "blocks.write": false
}
}'
# 重启 kibana 容器
docker restart elasticsearch_kibana_1
```

## ES 一点日常使用小技巧备注
```bash
# 查看 es 集群节点状态及版本
curl -X GET 'http://localhost:9200/_cat/nodes?v'
curl -X GET 'http://localhost:9200/_nodes?filter_path=nodes.*.version'|jq
# 查看 es 索引信息
curl -X GET 'http://localhost:9200/_cat/indices?v'
curl -X GET 'http://localhost:9200/_cat/indices/*-2024.04*'
# 手动批量清理索引:
curl -X DELETE 'http://localhost:9200/*-2024.04.0*'
```
批量清理删除索引默认情况可能遇到错误提示：
```yaml
{"error":{"root_cause":[{"type":"illegal_argument_exception","reason":"Wildcard expressions or all indices are not allowed"}],"type":"illegal_argument_exception","reason":"Wildcard expressions or all indices are not allowed"},"status":400}
```
`Elasticsearch` 默认安全严谨不允许在删除操作中使用通配符表达式或删除所有索引，即参数 `action.destructive_requires_name` 默认值是 `true`，所以删除清理索引时如需使用通配符表达式来批量清理，需要临时设置为 `false` 关闭
```bash
curl -XPUT 'http://localhost:9200/_cluster/settings' -H 'Content-Type: application/json' -d '{
  "transient": {
    "action.destructive_requires_name": false
  }
}'
```

## 参考文档
[Resolve migrations failures](https://www.elastic.co/guide/en/kibana/current/resolve-migrations-failures.html)
