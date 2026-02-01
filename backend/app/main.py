import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.middleware.auth import router as auth_router
from app.api.routes.shows import router as shows_router
from app.api.routes.episodes import router as episodes_router
from app.core.database import engine
from app.core.errors import APIException, api_exception_handler
from app.core.logging import setup_logging, get_logger
from app.models.base import Base
from app.config import settings

# Setup logging
setup_logging()
logger = get_logger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle management (startup/shutdown)."""
    # Startup: Initialize database
    logger.info("Starting up application...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database initialized")
    yield
    # Shutdown: Cleanup
    logger.info("Shutting down application...")
    await engine.dispose()
    logger.info("Application shutdown complete")


# Initialize FastAPI app
app = FastAPI(
    title="Podcast Manager API",
    description="REST API for podcast content management system",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Exception handlers
app.add_exception_handler(APIException, api_exception_handler)


# Include routers
app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])
app.include_router(shows_router, prefix="/api/shows", tags=["Shows"])
app.include_router(episodes_router, prefix="/api/shows/{show_id}/episodes", tags=["Episodes"])


# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {"status": "healthy", "environment": settings.ENVIRONMENT}


@app.get("/")
async def root():
    """Root endpoint."""
    return {"message": "Podcast Manager API", "version": "1.0.0"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        app,
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=settings.DEBUG,
        log_level="info" if not settings.DEBUG else "debug",
    )
