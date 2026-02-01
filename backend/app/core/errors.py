from typing import Any

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse


class APIException(Exception):
    """Base API exception"""

    def __init__(
        self,
        message: str,
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        error_code: str = "INTERNAL_SERVER_ERROR",
        details: dict[str, Any] | None = None,
    ):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code
        self.details = details or {}


class ValidationException(APIException):
    """Validation error"""

    def __init__(
        self,
        message: str,
        details: dict[str, Any] | None = None,
    ):
        super().__init__(
            message,
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            error_code="VALIDATION_ERROR",
            details=details,
        )


class NotFoundException(APIException):
    """Resource not found"""

    def __init__(self, message: str, resource: str = "Resource"):
        super().__init__(
            message or f"{resource} not found",
            status_code=status.HTTP_404_NOT_FOUND,
            error_code="NOT_FOUND",
        )


class UnauthorizedException(APIException):
    """Unauthorized access"""

    def __init__(self, message: str = "Not authenticated"):
        super().__init__(
            message,
            status_code=status.HTTP_401_UNAUTHORIZED,
            error_code="UNAUTHORIZED",
        )


class ForbiddenException(APIException):
    """Forbidden access"""

    def __init__(self, message: str = "Access forbidden"):
        super().__init__(
            message,
            status_code=status.HTTP_403_FORBIDDEN,
            error_code="FORBIDDEN",
        )


class ConflictException(APIException):
    """Conflict (e.g., duplicate resource)"""

    def __init__(self, message: str, resource: str = "Resource"):
        super().__init__(
            message or f"{resource} already exists",
            status_code=status.HTTP_409_CONFLICT,
            error_code="CONFLICT",
        )


def error_response(exc: APIException) -> dict[str, Any]:
    """Generate error response"""
    return {
        "error": {
            "code": exc.error_code,
            "message": exc.message,
            "details": exc.details,
        }
    }


def add_exception_handlers(app: FastAPI) -> None:
    """Add exception handlers to FastAPI app"""

    @app.exception_handler(APIException)
    async def api_exception_handler(request: Request, exc: APIException):
        return JSONResponse(
            status_code=exc.status_code,
            content=error_response(exc),
        )

    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception):
        from app.core.config import settings

        if settings.DEBUG:
            raise
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content=error_response(
                APIException(
                    "Internal server error",
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )
            ),
        )
