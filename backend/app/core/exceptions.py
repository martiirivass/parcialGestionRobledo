"""
Exception handlers following RFC 7807 (Problem Details for HTTP APIs)
"""
from fastapi import Request, status
from fastapi.responses import JSONResponse


async def http_exception_handler(request: Request, exc):
    """Handle FastAPI HTTPException"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "type": "about:blank",
            "title": exc.detail if hasattr(exc, 'detail') else "Error",
            "status": exc.status_code,
            "detail": str(exc.detail) if hasattr(exc, 'detail') else str(exc),
            "instance": str(request.url),
        },
    )


async def general_exception_handler(request: Request, exc):
    """Handle unhandled exceptions"""
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "type": "about:blank",
            "title": "Internal Server Error",
            "status": 500,
            "detail": "An unexpected error occurred. Please try again later.",
            "instance": str(request.url),
        },
    )


def not_found_exception(detail: str, instance: str):
    """Create a 404 Not Found response"""
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content={
            "type": "about:blank",
            "title": "Not Found",
            "status": 404,
            "detail": detail,
            "instance": instance,
        },
    )


def unauthorized_exception(detail: str = "Could not validate credentials"):
    """Create a 401 Unauthorized response"""
    return JSONResponse(
        status_code=status.HTTP_401_UNAUTHORIZED,
        content={
            "type": "about:blank",
            "title": "Unauthorized",
            "status": 401,
            "detail": detail,
        },
    )


def forbidden_exception(detail: str = "Not enough permissions"):
    """Create a 403 Forbidden response"""
    return JSONResponse(
        status_code=status.HTTP_403_FORBIDDEN,
        content={
            "type": "about:blank",
            "title": "Forbidden",
            "status": 403,
            "detail": detail,
        },
    )


def conflict_exception(detail: str):
    """Create a 409 Conflict response"""
    return JSONResponse(
        status_code=status.HTTP_409_CONFLICT,
        content={
            "type": "about:blank",
            "title": "Conflict",
            "status": 409,
            "detail": detail,
        },
    )


def validation_exception(detail: str):
    """Create a 422 Validation Error response"""
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "type": "about:blank",
            "title": "Validation Error",
            "status": 422,
            "detail": detail,
        },
    )