"""数据库连接信息 Pydantic 校验模型。"""
from datetime import datetime
from typing import Optional

from pydantic import BaseModel, ConfigDict


# ═══════════════ MySQL ═══════════════
class MysqlInfoBase(BaseModel):
    default_db: int = 0
    db_addr: str
    db_port: int = 3306
    db_user: str
    db_pass: str
    db_name: str


class MysqlInfoCreate(MysqlInfoBase):
    pass


class MysqlInfoUpdate(BaseModel):
    default_db: Optional[int] = None
    db_addr: Optional[str] = None
    db_port: Optional[int] = None
    db_user: Optional[str] = None
    db_pass: Optional[str] = None
    db_name: Optional[str] = None


class MysqlInfoOut(MysqlInfoBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# ═══════════════ Redis ═══════════════
class RedisInfoBase(BaseModel):
    default_db: int = 0
    addr: str
    port: int = 6379
    password: str = ""
    db: int = 0


class RedisInfoCreate(RedisInfoBase):
    pass


class RedisInfoUpdate(BaseModel):
    default_db: Optional[int] = None
    addr: Optional[str] = None
    port: Optional[int] = None
    password: Optional[str] = None
    db: Optional[int] = None


class RedisInfoOut(RedisInfoBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None


# ═══════════════ MongoDB ═══════════════
class MongoInfoBase(BaseModel):
    default_db: int = 0
    mongo_url: str
    db_name: str


class MongoInfoCreate(MongoInfoBase):
    pass


class MongoInfoUpdate(BaseModel):
    default_db: Optional[int] = None
    mongo_url: Optional[str] = None
    db_name: Optional[str] = None


class MongoInfoOut(MongoInfoBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
