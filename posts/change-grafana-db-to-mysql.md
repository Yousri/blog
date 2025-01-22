---
date: 2024-07-04
title:  迁移 Grafana 默认的 SQLite DB 变更使用 MySQL
tags:
- Grafana
- SQLite
- Monitor
description: 日常监控需求中希望将原来部署的 `Grafana` 默认使用的 `SQLite` 数据库迁移变更为 `MySQL`，方便后续部署多实例时可使用同一份数据源，有利于如需扩展。
---
# 迁移 Grafana 默认的 SQLite DB 数据改为使用 MySQL 方式
## 背景
Grafana 默认部署使用的是 `sqlite3` 文件存储数据，在于告警查询时可能遇到锁情况，加上考虑如有需要扩展多实例部署方式的话，默认的存储方式可能不太适合，所以计划将默认 DB 变更调节为 `MySQL` 并希望将现有数据迁移（因为不希望重新配置用户及告警规则等信息）。

## 迁移过程的参考步骤

- 首先需要暂停 `Grafana` 服务，导出默认的 `SQLite` 数据库文件，如 `grafana.db` ；
- 可借助 `Grafana` 官方提供的工具 [`database-migrator`](https://github.com/grafana/database-migrator)  将数据库导出转化为支持 `MySQL` 协议的 `SQL` 文件；
- 修改 `Grafana` 配置文件 `grafana.ini` 数据库相关配置参数 `-e "GF_DATABASE_URL=mysql://$db_username:$db_passwd@$db_host:$db_port/$db_name"` 使用 `MySQL` 数据库；
- 重新启动 `Grafana` 让其在 `MySQL` 中设置数据库和表结构，初始化完再先关停下 `Grafana` ；
- 导入前面使用工具从 `SQLLite` 原生默认数据库中导出的 `sql` 数据到 `MySQL` 对应的 `DB` 中；
- 重新开启 `Grafana` 按理即可；

## 如果 `SQLite` 开启 `WAL` 模式情况
当 `SQLite` 开启 `wal` 模式的话，这种情况下，因为其数据是会分布在数据文件 `grafana.db` 和 日志文件 `grafana.db-wal` 中的  
同时，即便是简单重启 `Grafana` 服务也不一定会触发日志文件数据持久化合并到数据文件中，所以迁移过程中需要手动触发将这里的 日志文件 持久化合并到 数据文件中；
```bash
# 暂停 grafana 服务后，拷贝备份出 grafana.db 和 grafana.db-wal 文件后，手动执行下面命令触发
sqlite3 grafana.db "PRAGMA wal_checkpoint(TRUNCATE); VACUUM;"
```
最后再按上面工具导出为 `sql` 文件；

<Comment />
