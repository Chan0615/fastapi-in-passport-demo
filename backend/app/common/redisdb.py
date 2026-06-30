"""Redis 连接管理。

启动时从 redis_info 表读取默认配置建立连接，提供全局 Redis 客户端。
"""
import logging
from typing import Optional

import redis.asyncio as aioredis

logger = logging.getLogger(__name__)


class RedisManager:
    """Redis 连接管理器。"""

    def __init__(self) -> None:
        self._client: Optional[aioredis.Redis] = None

    async def connect(
        self,
        host: str = "127.0.0.1",
        port: int = 6379,
        password: str = "",
        db: int = 0,
    ) -> None:
        """建立 Redis 连接。"""
        self._client = aioredis.Redis(
            host=host,
            port=port,
            password=password or None,
            db=db,
            decode_responses=True,
        )
        await self._client.ping()
        logger.info(f"Redis 已连接: {host}:{port} db={db}")

    @property
    def client(self) -> aioredis.Redis:
        if not self._client:
            raise RuntimeError("Redis 未初始化，请先调用 connect()")
        return self._client

    async def close(self) -> None:
        if self._client:
            await self._client.close()
            logger.info("Redis 连接已关闭")

    async def set(self, key: str, value: str, ex: Optional[int] = None) -> None:
        await self.client.set(key, value, ex=ex)

    async def get(self, key: str) -> Optional[str]:
        return await self.client.get(key)

    async def delete(self, key: str) -> None:
        await self.client.delete(key)


redis_manager = RedisManager()
