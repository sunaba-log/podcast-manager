"""Artwork management routes."""

import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.lib.gcs import GCSClient
from app.lib.image_validator import ImageValidationError, ImageValidator
from app.models.base import Artwork, Podcast, User

router = APIRouter(prefix="/api/shows", tags=["artwork"])


@router.post("/{show_id}/artwork")
async def upload_artwork(
    show_id: str,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Upload or replace podcast artwork.

    Args:
        show_id: Podcast ID
        file: Image file (JPEG/PNG, minimum 3000x3000px)

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
        mime_type = file.content_type or "image/jpeg"

        # Validate artwork
        is_valid, warnings, width, height = ImageValidator.validate_artwork(
            content, file.filename or "artwork.jpg", mime_type
        )

        # Upload to GCS
        gcs_client = GCSClient()
        gcs_filename = f"artworks/{uuid.uuid4()}/{file.filename}"
        gcs_url = gcs_client.upload_file(gcs_filename, content, mime_type)

        # Delete old artwork if exists
        if podcast.artwork:
            old_artwork = podcast.artwork
            try:
                gcs_client.delete_file(old_artwork.gcs_url)
            except Exception:
                pass  # Ignore deletion errors
            db.delete(old_artwork)

        # Create artwork record
        artwork = Artwork(
            id=str(uuid.uuid4()),
            podcast_id=show_id,
            filename=file.filename or "artwork.jpg",
            gcs_url=gcs_url,
            width=width,
            height=height,
            file_size=len(content),
            is_valid=is_valid,
            validation_errors="; ".join(warnings) if warnings else None,
        )

        db.add(artwork)
        podcast.artwork_url = gcs_url
        db.commit()
        db.refresh(artwork)

        return {
            "id": artwork.id,
            "url": artwork.gcs_url,
            "width": artwork.width,
            "height": artwork.height,
            "file_size": artwork.file_size,
            "is_valid": artwork.is_valid,
            "warnings": warnings,
        }

    except ImageValidationError as e:
        raise HTTPException(status_code=422, detail=f"Image validation failed: {e!s}")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Upload failed: {e!s}")


@router.get("/{show_id}/artwork")
async def get_artwork(
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
        "is_valid": artwork.is_valid,
        "warnings": artwork.validation_errors.split("; ") if artwork.validation_errors else [],
    }


@router.delete("/{show_id}/artwork")
async def delete_artwork(
    show_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
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

    # Delete from GCS
    try:
        gcs_client = GCSClient()
        gcs_client.delete_file(artwork.gcs_url)
    except Exception:
        pass  # Ignore deletion errors

    db.delete(artwork)
    podcast.artwork_url = None
    db.commit()

    return {"message": "Artwork deleted successfully"}
