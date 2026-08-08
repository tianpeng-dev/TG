from fastapi import Request
from fastapi.responses import JSONResponse


class NotFoundError(Exception):
    def __init__(self, resource: str, resource_id: str):
        self.resource = resource
        self.resource_id = resource_id


class ConflictError(Exception):
    def __init__(self, message: str, client_version: int | None = None):
        self.message = message
        self.client_version = client_version


async def not_found_handler(request: Request, exc: NotFoundError) -> JSONResponse:
    return JSONResponse(
        status_code=404,
        content={
            "code": "NOT_FOUND",
            "message": f"{exc.resource} with id '{exc.resource_id}' not found",
        },
    )


async def conflict_handler(request: Request, exc: ConflictError) -> JSONResponse:
    return JSONResponse(
        status_code=409,
        content={
            "code": "CONFLICT",
            "message": exc.message,
            "details": {"clientVersion": exc.client_version} if exc.client_version else None,
        },
    )


class UnauthorizedError(Exception):
    def __init__(self, message: str = "Unauthorized"):
        self.message = message


class ForbiddenError(Exception):
    def __init__(self, message: str = "Forbidden"):
        self.message = message


class BadRequestError(Exception):
    def __init__(self, message: str):
        self.message = message


async def unauthorized_handler(request: Request, exc: UnauthorizedError) -> JSONResponse:
    return JSONResponse(
        status_code=401,
        content={"code": "UNAUTHORIZED", "message": exc.message},
    )


async def forbidden_handler(request: Request, exc: ForbiddenError) -> JSONResponse:
    return JSONResponse(
        status_code=403,
        content={"code": "FORBIDDEN", "message": exc.message},
    )


async def bad_request_handler(request: Request, exc: BadRequestError) -> JSONResponse:
    return JSONResponse(
        status_code=400,
        content={"code": "BAD_REQUEST", "message": exc.message},
    )
