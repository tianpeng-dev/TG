from datetime import datetime

from sqlalchemy import Boolean, DateTime, Integer, func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    """SQLAlchemy 2.0 声明基类"""

    pass


class TimestampMixin:
    """时间戳混入 —— 对应前端 schema 中的 created_at / updated_at"""

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
    )


class SyncMixin:
    """同步混入 —— 对应前端 schema 中的 client_version / synced"""

    client_version: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    synced: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
