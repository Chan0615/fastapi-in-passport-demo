"""数据源配置接口。"""
from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.common.database import get_db
from app.schemas import db_config as schemas
from app.services.system import db_config_service as service

router = APIRouter(prefix="/db-config", tags=["db-config"])


@router.get("/mysql", response_model=list[schemas.MysqlInfoOut])
def list_mysql(db: Session = Depends(get_db)):
    return service.get_mysql_list(db)


@router.get("/mysql/default", response_model=schemas.MysqlInfoOut)
def get_default_mysql(db: Session = Depends(get_db)):
    obj = service.get_default_mysql(db)
    if not obj:
        raise HTTPException(status_code=404, detail="默认 MySQL 连接未配置")
    return obj


@router.get("/mysql/{pk}", response_model=schemas.MysqlInfoOut)
def get_mysql(pk: int, db: Session = Depends(get_db)):
    obj = service.get_mysql_by_id(db, pk)
    if not obj:
        raise HTTPException(status_code=404, detail="MySQL 连接不存在")
    return obj


@router.post("/mysql", response_model=schemas.MysqlInfoOut, status_code=201)
def create_mysql(payload: schemas.MysqlInfoCreate, db: Session = Depends(get_db)):
    return service.create_mysql(db, payload.model_dump())


@router.put("/mysql/{pk}", response_model=schemas.MysqlInfoOut)
def update_mysql(pk: int, payload: schemas.MysqlInfoUpdate, db: Session = Depends(get_db)):
    obj = service.update_mysql(db, pk, payload.model_dump(exclude_unset=True))
    if not obj:
        raise HTTPException(status_code=404, detail="MySQL 连接不存在")
    return obj


@router.delete("/mysql/{pk}")
def delete_mysql(pk: int, db: Session = Depends(get_db)):
    if not service.delete_mysql(db, pk):
        raise HTTPException(status_code=404, detail="MySQL 连接不存在")
    return {"msg": "已删除"}


@router.get("/redis", response_model=list[schemas.RedisInfoOut])
def list_redis(db: Session = Depends(get_db)):
    return service.get_redis_list(db)


@router.get("/redis/default", response_model=schemas.RedisInfoOut)
def get_default_redis(db: Session = Depends(get_db)):
    obj = service.get_default_redis(db)
    if not obj:
        raise HTTPException(status_code=404, detail="默认 Redis 连接未配置")
    return obj


@router.get("/redis/{pk}", response_model=schemas.RedisInfoOut)
def get_redis(pk: int, db: Session = Depends(get_db)):
    obj = service.get_redis_by_id(db, pk)
    if not obj:
        raise HTTPException(status_code=404, detail="Redis 连接不存在")
    return obj


@router.post("/redis", response_model=schemas.RedisInfoOut, status_code=201)
def create_redis(payload: schemas.RedisInfoCreate, db: Session = Depends(get_db)):
    return service.create_redis(db, payload.model_dump())


@router.put("/redis/{pk}", response_model=schemas.RedisInfoOut)
def update_redis(pk: int, payload: schemas.RedisInfoUpdate, db: Session = Depends(get_db)):
    obj = service.update_redis(db, pk, payload.model_dump(exclude_unset=True))
    if not obj:
        raise HTTPException(status_code=404, detail="Redis 连接不存在")
    return obj


@router.delete("/redis/{pk}")
def delete_redis(pk: int, db: Session = Depends(get_db)):
    if not service.delete_redis(db, pk):
        raise HTTPException(status_code=404, detail="Redis 连接不存在")
    return {"msg": "已删除"}


@router.get("/mongo", response_model=list[schemas.MongoInfoOut])
def list_mongo(db: Session = Depends(get_db)):
    return service.get_mongo_list(db)


@router.get("/mongo/default", response_model=schemas.MongoInfoOut)
def get_default_mongo(db: Session = Depends(get_db)):
    obj = service.get_default_mongo(db)
    if not obj:
        raise HTTPException(status_code=404, detail="默认 MongoDB 连接未配置")
    return obj


@router.get("/mongo/{pk}", response_model=schemas.MongoInfoOut)
def get_mongo(pk: int, db: Session = Depends(get_db)):
    obj = service.get_mongo_by_id(db, pk)
    if not obj:
        raise HTTPException(status_code=404, detail="MongoDB 连接不存在")
    return obj


@router.post("/mongo", response_model=schemas.MongoInfoOut, status_code=201)
def create_mongo(payload: schemas.MongoInfoCreate, db: Session = Depends(get_db)):
    return service.create_mongo(db, payload.model_dump())


@router.put("/mongo/{pk}", response_model=schemas.MongoInfoOut)
def update_mongo(pk: int, payload: schemas.MongoInfoUpdate, db: Session = Depends(get_db)):
    obj = service.update_mongo(db, pk, payload.model_dump(exclude_unset=True))
    if not obj:
        raise HTTPException(status_code=404, detail="MongoDB 连接不存在")
    return obj


@router.delete("/mongo/{pk}")
def delete_mongo(pk: int, db: Session = Depends(get_db)):
    if not service.delete_mongo(db, pk):
        raise HTTPException(status_code=404, detail="MongoDB 连接不存在")
    return {"msg": "已删除"}
