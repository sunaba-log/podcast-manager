"""Dependency injection container for FastAPI endpoints.

This module provides dependency injection functions that can be used
with FastAPI's Depends() to inject services and utilities into endpoints.
"""

from typing import Annotated

from fastapi import Depends

from app.core.config import settings
from app.core.logging import get_logger
from app.lib.storage import StorageBackend
from app.lib.storage_gcs import GCSBackend
from app.lib.storage_r2 import R2Backend

logger = get_logger(__name__)


def get_storage_backend() -> StorageBackend:
    """Get the configured storage backend.

    Returns the appropriate storage backend based on STORAGE_BACKEND
    configuration setting (gcs or r2).

    Returns:
        StorageBackend: Configured storage backend instance

    Raises:
        ValueError: If STORAGE_BACKEND is not configured or invalid

    Example:
        @app.post("/upload")
        async def upload(storage: Annotated[StorageBackend, Depends(get_storage_backend)]):
            signed_url = storage.generate_signed_url("path/to/file")
    """
    backend_type = settings.STORAGE_BACKEND.lower()

    if backend_type == "gcs":
        logger.debug("Using GCS storage backend")
        return GCSBackend()
    elif backend_type == "r2":
        logger.debug("Using R2 storage backend")
        return R2Backend()
    else:
        raise ValueError(f"Invalid STORAGE_BACKEND: {backend_type}. Must be 'gcs' or 'r2'")


def get_gcs_backend() -> GCSBackend:
    """Get the GCS storage backend explicitly.

    Useful when you specifically need GCS operations regardless
    of the current STORAGE_BACKEND configuration.

    Returns:
        GCSBackend: GCS storage backend instance

    Raises:
        ValueError: If GCS credentials are not configured

    Example:
        @app.post("/backup-to-gcs")
        async def backup(gcs: Annotated[GCSBackend, Depends(get_gcs_backend)]):
            # Force backup to GCS even if primary backend is R2
    """
    logger.debug("Getting explicit GCS storage backend")
    return GCSBackend()


def get_r2_backend() -> R2Backend:
    """Get the R2 storage backend explicitly.

    Useful when you specifically need R2 operations regardless
    of the current STORAGE_BACKEND configuration.

    Returns:
        R2Backend: R2 storage backend instance

    Raises:
        ValueError: If R2 credentials are not configured

    Example:
        @app.post("/archive-to-r2")
        async def archive(r2: Annotated[R2Backend, Depends(get_r2_backend)]):
            # Force archival to R2 for long-term storage
    """
    logger.debug("Getting explicit R2 storage backend")
    return R2Backend()


# Type aliases for cleaner dependency annotations
StorageBackendDep = Annotated[StorageBackend, Depends(get_storage_backend)]
GCSBackendDep = Annotated[GCSBackend, Depends(get_gcs_backend)]
R2BackendDep = Annotated[R2Backend, Depends(get_r2_backend)]
