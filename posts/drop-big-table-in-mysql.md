---
date: 2023-12-12
title:  平滑清理 MySQL / MariaDB 实例大表
tags:
- mysql
- mariadb
description: 业务研发直接将 rpc log 往业务关系数据库实例 MySQL 的表里扔，导致这日志表数据异常大，单表数据超过一百多 G 容量，需要做清理；
---
# 平滑清理 MySQL / MariaDB 实例大表

## 数据库集群 Mariadb Galera Cluster 清理 `drop tms_rpc_log` 大表

涉及步骤流程大致：

1. 事先对 `tms_rpc_log` 独立表空间数据文件做 硬链接 
```bash
cd /var/lib/mysql/tms_mastert;ln tms_rpc_log.ibd tms_rpc_log.ibd.hdlk
```
2. 单独手动操作 `mysqldump` 再备份一份 `tms_rpc_log` 表
```bash
mysqldump --user="tms_master_user" --password="passwd"  --single-transaction tms_master tms_rpc_log| gzip -c >  2023-12-12.tms_rpc_log.sql.gz
```
3. 集群上某台 MySQL 实例下执行 (如 r31 )
```bash
mysql> use tms_master;
mysql> drop tms_rpc_log;
```
4. 使用 `truncate` 慢慢删除清理实际的表数据文件 `tms_rpc_log.ibd.hdlk`；
```bash
cd /var/lib/mysql/tms_master
for i in `seq 114 -1 2 `;do sleep 1; truncate -s ${i}G tms_rpc_log.ibd.hdlk; done
```

