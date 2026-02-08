"""Storage Backend Usage Guide

This document explains how to use the new storage abstraction layer
in the Podcast Manager application.

## Overview

The storage backend abstraction layer provides a unified interface for
interacting with different cloud storage providers (Google Cloud Storage,
Cloudflare R2, etc.). This allows the application to work with different
storage backends without changing the business logic code.

## Configured Backend

The active storage backend is determined by the STORAGE_BACKEND environment
variable in .env or settings:

    STORAGE_BACKEND=gcs  # or "r2" for Cloudflare R2

## Usage Examples

### 1. Basic Usage in Endpoints

Use FastAPI dependency injection to get the configured backend:

    from fastapi import APIRouter, Depends
    from app.core.dependencies import StorageBackendDep
    
    router = APIRouter()
    
    @router.post("/upload")
    async def upload(storage: StorageBackendDep):
        # Generate a signed URL for client-side upload
        url = storage.generate_signed_url(
            "uploads/audio/episode-123.mp3",
            expiration=timedelta(hours=1),
            method="PUT"
        )
        return {"signed_url": url}

### 2. Getting Specific Backends

For scenarios where you need a specific backend:

    from app.core.dependencies import GCSBackendDep, R2BackendDep
    
    @router.post("/backup")
    async def backup(gcs: GCSBackendDep):
        # Always backup to GCS, regardless of active backend
        success = gcs.upload_from_file(
            "local_file.mp3",
            "backups/episode-123.mp3"
        )
        return {"backed_up": success}

### 3. File Operations

All backends support these operations:

    storage = get_storage_backend()
    
    # Generate signed URL (for client-side uploads)
    url = storage.generate_signed_url("path/to/file", method="PUT")
    
    # Get public URL (for RSS feeds, public files)
    url = storage.get_public_url("path/to/file")
    
    # Check file existence
    exists = storage.file_exists("path/to/file")
    
    # Get file size
    size = storage.get_file_size("path/to/file")
    
    # Upload from memory
    success = storage.upload_from_string(
        b"file content",
        "path/to/file",
        content_type="audio/mpeg"
    )
    
    # Upload from disk
    success = storage.upload_from_file(
        "/tmp/local_file.mp3",
        "path/to/file",
        content_type="audio/mpeg"
    )
    
    # Delete file
    success = storage.delete_file("path/to/file")
    
    # Copy between backends
    r2 = get_r2_backend()
    success = storage.copy_to_backend(
        "source/file.mp3",
        r2,
        "archive/file.mp3"
    )

## Configuration

### Google Cloud Storage (GCS)

Set in .env:

    STORAGE_BACKEND=gcs
    GCS_PROJECT_ID=my-gcp-project
    GCS_BUCKET_NAME=my-podcast-bucket
    GCS_SERVICE_ACCOUNT_JSON={"type":"service_account",...}

### Cloudflare R2

Set in .env:

    STORAGE_BACKEND=r2
    R2_ACCOUNT_ID=abc123def456
    R2_ACCESS_KEY_ID=my-access-key
    R2_SECRET_ACCESS_KEY=my-secret-key
    R2_BUCKET_NAME=my-r2-bucket
    R2_PUBLIC_URL=https://cdn.example.com

## Storage Backend Selection Strategy

The application is designed to support hybrid workflows:

1. **Primary Storage (Audio Files)**
   - Upload to GCS initially (cheaper egress, better for US-based serving)
   - Generate signed URLs for client-side upload
   - Serve via GCS public URL or signed URL for authenticated users

2. **Archive Storage (Long-term Backup)**
   - Copy files from GCS to R2 using copy_to_backend()
   - Use for long-term archival with lower-cost egress
   - Useful for backup and disaster recovery

3. **RSS Feed Distribution**
   - Serve from whichever backend has better geographic proximity to podcast platforms
   - GCS: Faster for US/EU distribution
   - R2: Better global edge network for international distribution

## Migration from Old GCS API

The old GCSClient API is deprecated but maintained for backward compatibility.

Old code:

    from app.lib.gcs import get_gcs_client
    
    client = get_gcs_client()
    url = client.generate_signed_url("path/to/file")

New code:

    from app.core.dependencies import get_storage_backend
    
    storage = get_storage_backend()
    url = storage.generate_signed_url("path/to/file")

The method signatures remain the same, so migration is straightforward.

## Error Handling

All storage operations may raise exceptions in error cases:

    from app.lib.storage import StorageBackend
    
    async def safe_upload(storage: StorageBackendDep, data: bytes, path: str):
        try:
            success = storage.upload_from_string(data, path)
            if not success:
                # Graceful failure (returned False)
                logger.error(f"Upload failed for {path}")
            return success
        except ValueError as e:
            # Configuration error (e.g., credentials not set)
            logger.error(f"Storage configuration error: {e}")
            raise
        except Exception as e:
            # Other errors (network, permission, etc.)
            logger.error(f"Storage operation failed: {e}")
            raise

## Testing with Different Backends

During development/testing, switch backends by changing .env:

    # Test with GCS
    STORAGE_BACKEND=gcs
    python -m pytest tests/

    # Test with R2
    STORAGE_BACKEND=r2
    python -m pytest tests/

## Performance Considerations

- **Signed URLs**: Generated by the backend, no network round-trip
- **File existence check**: Requires metadata lookup (one API call)
- **Copy operations**: Download + upload, use for smaller files (<1GB)
- **Concurrent uploads**: All backends support concurrent operations

Timeout is configurable:

    STORAGE_TIMEOUT_SECONDS=30  # Default: 30 seconds

## Thread Safety

All backend instances are thread-safe. The dependency injection pattern
in FastAPI ensures proper isolation in concurrent requests.
"""
