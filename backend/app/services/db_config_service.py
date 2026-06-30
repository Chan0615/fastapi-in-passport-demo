"""数据库连接信息服务：从 mysql_info / redis_info / mongo_info 表读取连接配置。"""
import logging
from typing import List, Optional

from sqlalchemy.orm import Session

from app.models.db_config import MysqlInfo, RedisInfo, MongoInfo

logger = logging.getLogger(__name__)


# ═══════════════ MySQL ═══════════════

def get_mysql_list(db: Session) -> List[MysqlInfo]:
    return db.query(MysqlInfo).all()


def get_default_mysql(db: Session) -> Optional[MysqlInfo]:
    return db.query(MysqlInfo).filter(MysqlInfo.default_db == 1).first()


def get_mysql_by_id(db: Session, pk: int) -> Optional[MysqlInfo]:
    return db.query(MysqlInfo).filter(MysqlInfo.id == pk).first()


def create_mysql(db: Session, data: dict) -> MysqlInfo:
    obj = MysqlInfo(**data)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def update_mysql(db: Session, pk: int, data: dict) -> Optional[MysqlInfo]:
    obj = db.query(MysqlInfo).filter(MysqlInfo.id == pk).first()
    if not obj:
        return None
    for k, v in data.items():
        if v is not None:
            setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj


def delete_mysql(db: Session, pk: int) -> bool:
    obj = db.query(MysqlInfo).filter(MysqlInfo.id == pk).first()
    if not obj:
        return False
    db.delete(obj)
    db.commit()
    return True


# ═══════════════ Redis ═══════════════

def get_redis_list(db: Session) -> List[RedisInfo]:
    return db.query(RedisInfo).all()


def get_default_redis(db: Session) -> Optional[RedisInfo]:
    return db.query(RedisInfo).filter(RedisInfo.default_db == 1).first()


def get_redis_by_id(db: Session, pk: int) -> Optional[RedisInfo]:
    return db.query(RedisInfo).filter(RedisInfo.id == pk).first()


def create_redis(db: Session, data: dict) -> RedisInfo:
    obj = RedisInfo(**data)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def update_redis(db: Session, pk: int, data: dict) -> Optional[RedisInfo]:
    obj = db.query(RedisInfo).filter(RedisInfo.id == pk).first()
    if not obj:
        return None
    for k, v in data.items():
        if v is not None:
            setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj


def delete_redis(db: Session, pk: int) -> bool:
    obj = db.query(RedisInfo).filter(RedisInfo.id == pk).first()
    if not obj:
        return False
    db.delete(obj)
    db.commit()
    return True


# ═══════════════ MongoDB ═══════════════

def get_mongo_list(db: Session) -> List[MongoInfo]:
    return db.query(MongoInfo).all()


def get_default_mongo(db: Session) -> Optional[MongoInfo]:
    return db.query(MongoInfo).filter(MongoInfo.default_db == 1).first()


def get_mongo_by_id(db: Session, pk: int) -> Optional[MongoInfo]:
    return db.query(MongoInfo).filter(MongoInfo.id == pk).first()


def create_mongo(db: Session, data: dict) -> MongoInfo:
    obj = MongoInfo(**data)
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


def update_mongo(db: Session, pk: int, data: dict) -> Optional[MongoInfo]:
    obj = db.query(MongoInfo).filter(MongoInfo.id == pk).first()
    if not obj:
        return None
    for k, v in data.items():
        if v is not None:
            setattr(obj, k, v)
    db.commit()
    db.refresh(obj)
    return obj


def delete_mongo(db: Session, pk: int) -> bool:
    obj = db.query(MongoInfo).filter(MongoInfo.id == pk).first()
    if not obj:
        return False
    db.delete(obj)
    db.commit()
    return True
