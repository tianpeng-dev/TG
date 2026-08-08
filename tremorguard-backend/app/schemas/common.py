from typing import Generic, TypeVar

from pydantic import BaseModel, ConfigDict, Field

T = TypeVar("T")


class ApiError(BaseModel):
    """对应前端 contracts.ts 中的 ApiError"""

    model_config = ConfigDict(populate_by_name=True)

    code: str
    message: str
    details: dict[str, object] | None = None


class PaginatedResponse(BaseModel, Generic[T]):  # noqa: UP046
    """对应前端 contracts.ts 中的 PaginatedResponse<T>"""

    model_config = ConfigDict(populate_by_name=True)

    items: list[T]
    total: int
    page: int
    page_size: int = Field(alias="pageSize")
