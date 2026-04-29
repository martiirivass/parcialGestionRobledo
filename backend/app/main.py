"""
Food Store - FastAPI Application
E-commerce System for Food Products
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.database import create_db_and_tables


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    create_db_and_tables()
    yield


# Create FastAPI app
app = FastAPI(
    title="Food Store API",
    description="E-commerce API for food products",
    version="1.0.0",
    lifespan=lifespan,
)

# Rate limiter
limiter = Limiter(key_func=get_remote_address)


# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Exception handlers
@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request, exc):
    return JSONResponse(
        status_code=429,
        content={
            "type": "about:blank",
            "title": "Too Many Requests",
            "status": 429,
            "detail": "Rate limit exceeded. Please try again later.",
        },
    )


# Health check
@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "food-store-api"}


# Import and register routers
from app.auth.router import router as auth_router
from app.usuarios.router import router as usuarios_router
from app.categorias.router import router as categorias_router
from app.productos.router import router as productos_router
from app.pedidos.router import router as pedidos_router
from app.pagos.router import router as pagos_router
from app.direcciones.router import router as direcciones_router

app.include_router(auth_router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(usuarios_router, prefix="/api/v1/usuarios", tags=["usuarios"])
app.include_router(categorias_router, prefix="/api/v1/categorias", tags=["categorias"])
app.include_router(productos_router, prefix="/api/v1/productos", tags=["productos"])
app.include_router(pedidos_router, prefix="/api/v1/pedidos", tags=["pedidos"])
app.include_router(pagos_router, prefix="/api/v1/pagos", tags=["pagos"])
app.include_router(direcciones_router, prefix="/api/v1/direcciones", tags=["direcciones"])


# TODO: Add admin router when needed