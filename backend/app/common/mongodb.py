"""MongoDB 连接管理。

启动时从 mongo_info 表读取默认配置建立连接，提供全局 MongoDB 客户端。
"""
import logging
from typing import Optional

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

logger = logging.getLogger(__name__)


class MongoManager:
    """MongoDB 连接管理器。"""

    def __init__(self) -> None:
        self._client: Optional[AsyncIOMotorClient] = None
        self._db: Optional[AsyncIOMotorDatabase] = None

    async def connect(self, mongo_url: str = "mongodb://127.0.0.1:27017", db_name: str = "test") -> None:
        """建立 MongoDB 连接。"""
        self._client = AsyncIOMotorClient(mongo_url)
        self._db = self._client[db_name]
        # 验证连接
        await self._client.admin.command("ping")
        logger.info(f"MongoDB 已连接: {mongo_url} db={db_name}")

    @property
    def db(self) -> AsyncIOMotorDatabase:
        if not self._db:
            raise RuntimeError("MongoDB 未初始化，请先调用 connect()")
        return self._db

    @property
    def client(self) -> AsyncIOMotorClient:
        if not self._client:
            raise RuntimeError("MongoDB 未初始化，请先调用 connect()")
        return self._client

    def collection(self, name: str):
        """获取指定集合。"""
        return self.db[name]

    async def close(self) -> None:
        if self._client:
            self._client.close()
            logger.info("MongoDB 连接已关闭")


mongo_manager = MongoManager()
