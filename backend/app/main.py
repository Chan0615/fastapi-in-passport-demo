"""FastAPI 应用入口。"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import bootstrap_config
from app.common.database import engine, Base
from app.common.log_middleware import OperationLogMiddleware
from app.api.v1.api import api_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # 启动时自动建表（仅业务表，用户/角色/菜单已迁移至 passport）
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title=bootstrap_config.app.name,
    version=bootstrap_config.app.version,
    debug=bootstrap_config.app.debug,
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=bootstrap_config.security.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(OperationLogMiddleware)

app.include_router(api_router, prefix="/api/v1")


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "version": bootstrap_config.app.version,
        "env": bootstrap_config.app_env,
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
