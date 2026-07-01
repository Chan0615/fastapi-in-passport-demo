"""数据库连接信息模型：mysql_info / redis_info / mongo_info。"""
from sqlalchemy import Column, DateTime, Integer, String
from sqlalchemy.sql import func

from app.common.database import Base


class MysqlInfo(Base):
    __tablename__ = "mysql_info"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, comment="主键")
    db_section = Column(String(64), nullable=False, default="default", comment="业务分区")
    default_db = Column(Integer, default=0, comment="是否默认库，1=是，0=否")
    db_addr = Column(String(64), nullable=False, comment="数据库地址")
    db_port = Column(Integer, nullable=False, default=3306, comment="端口")
    db_user = Column(String(64), nullable=False, comment="用户名")
    db_pass = Column(String(128), nullable=False, comment="密码")
    db_name = Column(String(128), nullable=False, comment="数据库名")
    created_at = Column(DateTime, server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), comment="更新时间")


class RedisInfo(Base):
    __tablename__ = "redis_info"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, comment="主键")
    db_section = Column(String(64), nullable=False, default="default", comment="业务分区")
    default_db = Column(Integer, default=0, comment="是否默认库，1=是，0=否")
    addr = Column(String(64), nullable=False, comment="Redis 地址")
    port = Column(Integer, nullable=False, default=6379, comment="Redis 端口")
    password = Column(String(128), default="", comment="Redis 密码")
    db = Column(Integer, default=0, comment="Redis DB 编号")
    created_at = Column(DateTime, server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), comment="更新时间")


class MongoInfo(Base):
    __tablename__ = "mongo_info"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True, comment="主键")
    db_section = Column(String(64), nullable=False, default="default", comment="业务分区")
    default_db = Column(Integer, default=0, comment="是否默认库，1=是，0=否")
    mongo_url = Column(String(512), nullable=False, comment="MongoDB 连接串")
    db_name = Column(String(128), nullable=False, comment="数据库名")
    created_at = Column(DateTime, server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now(), comment="更新时间")
