"""Artwork management routes."""

import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.dependencies import get_storage_client
from app.core.security import get_current_user
from app.lib.image_validator import ImageValidationError, ImageValidator
from app.lib.storage import StorageClient
from app.models.base import Artwork, Episode, Podcast, User

router = APIRouter(prefix="/api/shows", tags=["artwork"])


@router.post("/{show_id}/artwork")
async def upload_show_artwork(
    show_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    storage: StorageClient = Depends(get_storage_client),
):
    """
    Upload or replace podcast artwork.

    Args:
        show_id: Podcast ID
        file: Image file (JPEG/PNG/WebP)

    Returns:
        Artwork metadata with validation results

    Raises:
        404: Podcast not found or user doesn't have permission
        400: Invalid file format or size
        422: Image dimensions below minimum
    """
    # Verify podcast exists and user owns it
    podcast = db.query(Podcast).filter(Podcast.id == show_id).first()
    if not podcast:
        raise HTTPException(status_code=404, detail="Podcast not found")

    if podcast.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="You do not have permission to modify this podcast")

    try:
        # Read file content
        content = await file.read()
        mime_type = file.content_type

        # Validate artwork
        is_valid, result = ImageValidator.validate_artwork(content, file.filename or "artwork", mime_type)

        if result["status"] == "FAILED":
            raise HTTPException(status_code=422, detail={"errors": result["errors"], "warnings": result["warnings"]})

        # Upload to storage backend
        storage_key = f"podcasts/{show_id}/artwork/{uuid.uuid4()}"
        public_url = storage.upload_file(storage_key, content, result["mime_type"])

        # Delete old artwork if exists
        if podcast.artwork:
            old_artwork = podcast.artwork
            try:
                storage.delete_file(old_artwork.storage_key)
            except Exception:
                pass  # Ignore deletion errors
            db.delete(old_artwork)

        # Create artwork record
        artwork = Artwork(
            id=str(uuid.uuid4()),
            podcast_id=show_id,
            filename=file.filename or "artwork",
            gcs_url=public_url,
            storage_key=storage_key,
            width=result["width"],
            height=result["height"],
            file_size=result["file_size"],
            mime_type=result["mime_type"],
            validation_status=result["status"],
            validation_warnings=", ".join(result["warnings"]) if result["warnings"] else None,
            is_valid=is_valid,
        )

        db.add(artwork)
        db.commit()
        db.refresh(artwork)

        return {
            "id": artwork.id,
            "url": artwork.gcs_url,
            "width": artwork.width,
            "height": artwork.height,
            "file_size": artwork.file_size,
            "mime_type": artwork.mime_type,
            "validation_status": artwork.validation_status,
            "validation_warnings": artwork.validation_warnings.split(", ") if artwork.validation_warnings else [],
            "is_valid": artwork.is_valid,
        }

    except HTTPException:
        raise
    except ImageValidationError as e:
        raise HTTPException(status_code=422, detail=f"Image validation failed: {e!s}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Upload failed: {e!s}")


@router.get("/{show_id}/artwork")
async def get_show_artwork(
    show_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Retrieve podcast artwork.

    Args:
        show_id: Podcast ID

    Returns:
        Artwork metadata with validation results

    Raises:
        404: Podcast or artwork not found
        403: User doesn't have permission
    """
    podcast = db.query(Podcast).filter(Podcast.id == show_id).first()
    if not podcast:
        raise HTTPException(status_code=404, detail="Podcast not found")

    # Check permission (owner or team member)
    if podcast.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="You do not have permission to view this podcast")

    artwork = db.query(Artwork).filter(Artwork.podcast_id == show_id).first()
    if not artwork:
        raise HTTPException(status_code=404, detail="No artwork uploaded yet")

    return {
        "id": artwork.id,
        "url": artwork.gcs_url,
        "width": artwork.width,
        "height": artwork.height,
        "file_size": artwork.file_size,
        "mime_type": artwork.mime_type,
        "validation_status": artwork.validation_status,
        "validation_warnings": artwork.validation_warnings.split(", ") if artwork.validation_warnings else [],
        "is_valid": artwork.is_valid,
    }


@router.delete("/{show_id}/artwork")
async def delete_show_artwork(
    show_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    storage: StorageClient = Depends(get_storage_client),
):
    """
    Delete podcast artwork.

    Args:
        show_id: Podcast ID

    Returns:
        Success message

    Raises:
        404: Podcast not found
        403: User doesn't have permission
    """
    podcast = db.query(Podcast).filter(Podcast.id == show_id).first()
    if not podcast:
        raise HTTPException(status_code=404, detail="Podcast not found")

    if podcast.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="You do not have permission to modify this podcast")

    artwork = db.query(Artwork).filter(Artwork.podcast_id == show_id).first()
    if not artwork:
        raise HTTPException(status_code=404, detail="No artwork to delete")

    # Delete from storage backend
    try:
        storage.delete_file(artwork.storage_key)
    except Exception:
        pass  # Ignore deletion errors

    db.delete(artwork)
    db.commit()

    return {"message": "Artwork deleted successfully"}


# Episode-level artwork endpoints
@router.post("/{show_id}/episodes/{episode_id}/artwork")
async def upload_episode_artwork(
    show_id: str,
    episode_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    storage: StorageClient = Depends(get_storage_client),
):
    """
    Upload or replace episode artwork.

    Args:
        show_id: Podcast ID
        episode_id: Episode ID
        file: Image file

    Returns:
        Artwork metadata with validation results
    """
    # Verify podcast and episode exist
    podcast = db.query(Podcast).filter(Podcast.id == show_id).first()
    if not podcast:
        raise HTTPException(status_code=404, detail="Podcast not found")

    episode = db.query(Episode).filter(Episode.id == episode_id, Episode.podcast_id == show_id).first()
    if not episode:
        raise HTTPException(status_code=404, detail="Episode not found")

    if podcast.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="You do not have permission to modify this podcast")

    try:
        # Read file content
        content = await file.read()
        mime_type = file.content_type

        # Validate artwork
        is_valid, result = ImageValidator.validate_artwork(content, file.filename or "artwork", mime_type)

        if result["status"] == "FAILED":
            raise HTTPException(status_code=422, detail={"errors": result["errors"], "warnings": result["warnings"]})

        # Upload to storage backend
        storage_key = f"podcasts/{show_id}/episodes/{episode_id}/artwork/{uuid.uuid4()}"
        public_url = storage.upload_file(storage_key, content, result["mime_type"])

        # Delete old artwork if exists
        if episode.artwork:
            old_artwork = episode.artwork
            try:
                storage.delete_file(old_artwork.storage_key)
            except Exception:
                pass
            db.delete(old_artwork)

        # Create artwork record
        artwork = Artwork(
            id=str(uuid.uuid4()),
            episode_id=episode_id,
            filename=file.filename or "artwork",
            gcs_url=public_url,
            storage_key=storage_key,
            width=result["width"],
            height=result["height"],
            file_size=result["file_size"],
            mime_type=result["mime_type"],
            validation_status=result["status"],
            validation_warnings=", ".join(result["warnings"]) if result["warnings"] else None,
            is_valid=is_valid,
        )

        db.add(artwork)
        db.commit()
        db.refresh(artwork)

        return {
            "id": artwork.id,
            "url": artwork.gcs_url,
            "width": artwork.width,
            "height": artwork.height,
            "file_size": artwork.file_size,
            "mime_type": artwork.mime_type,
            "validation_status": artwork.validation_status,
            "validation_warnings": artwork.validation_warnings.split(", ") if artwork.validation_warnings else [],
            "is_valid": artwork.is_valid,
        }

    except HTTPException:
        raise
    except ImageValidationError as e:
        raise HTTPException(status_code=422, detail=f"Image validation failed: {e!s}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Upload failed: {e!s}")


@router.get("/{show_id}/episodes/{episode_id}/artwork")
async def get_episode_artwork(
    show_id: str,
    episode_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get episode artwork."""
    podcast = db.query(Podcast).filter(Podcast.id == show_id).first()
    if not podcast:
        raise HTTPException(status_code=404, detail="Podcast not found")

    if podcast.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="You do not have permission to view this podcast")

    episode = db.query(Episode).filter(Episode.id == episode_id, Episode.podcast_id == show_id).first()
    if not episode:
        raise HTTPException(status_code=404, detail="Episode not found")

    artwork = db.query(Artwork).filter(Artwork.episode_id == episode_id).first()
    if not artwork:
        raise HTTPException(status_code=404, detail="No artwork uploaded yet")

    return {
        "id": artwork.id,
        "url": artwork.gcs_url,
        "width": artwork.width,
        "height": artwork.height,
        "file_size": artwork.file_size,
        "mime_type": artwork.mime_type,
        "validation_status": artwork.validation_status,
        "validation_warnings": artwork.validation_warnings.split(", ") if artwork.validation_warnings else [],
        "is_valid": artwork.is_valid,
    }


@router.delete("/{show_id}/episodes/{episode_id}/artwork")
async def delete_episode_artwork(
    show_id: str,
    episode_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    storage: StorageClient = Depends(get_storage_client),
):
    """Delete episode artwork."""
    podcast = db.query(Podcast).filter(Podcast.id == show_id).first()
    if not podcast:
        raise HTTPException(status_code=404, detail="Podcast not found")

    if podcast.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="You do not have permission to modify this podcast")

    episode = db.query(Episode).filter(Episode.id == episode_id, Episode.podcast_id == show_id).first()
    if not episode:
        raise HTTPException(status_code=404, detail="Episode not found")

    artwork = db.query(Artwork).filter(Artwork.episode_id == episode_id).first()
    if not artwork:
        raise HTTPException(status_code=404, detail="No artwork to delete")

    # Delete from storage backend
    try:
        storage.delete_file(artwork.storage_key)
    except Exception:
        pass

    db.delete(artwork)
    db.commit()

    return {"message": "Episode artwork deleted successfully"}
