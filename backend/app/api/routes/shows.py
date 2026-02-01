"""Podcast shows management endpoints."""

from uuid import uuid4

from fastapi import APIRouter, Depends, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.middleware.auth import get_current_user
from app.core.database import get_db
from app.core.errors import NotFoundException, UnauthorizedException
from app.lib.validators import (
    PodcastCreate,
    PodcastResponse,
    PodcastUpdate,
)
from app.models.base import Podcast, User

router = APIRouter()


@router.post("/", response_model=PodcastResponse, status_code=status.HTTP_201_CREATED)
async def create_podcast(
    podcast_data: PodcastCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PodcastResponse:
    """
    Create a new podcast.

    - **title**: Podcast title
    - **description**: Podcast description
    - **language**: Language code (e.g., 'en', 'ja')
    """
    # Generate unique feed URL
    feed_url = f"podcast-{uuid4().hex[:8]}"

    # Create new podcast
    new_podcast = Podcast(
        id=str(uuid4()),
        owner_id=current_user.id,
        title=podcast_data.title,
        description=podcast_data.description,
        author=podcast_data.author or current_user.full_name,
        category=podcast_data.category,
        language=podcast_data.language,
        feed_url=feed_url,
        artwork_url=None,
        is_published=False,
    )

    db.add(new_podcast)
    await db.commit()
    await db.refresh(new_podcast)

    return PodcastResponse.from_orm(new_podcast)


@router.get("/{podcast_id}", response_model=PodcastResponse)
async def get_podcast(
    podcast_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PodcastResponse:
    """
    Get podcast details by ID.
    """
    result = await db.execute(select(Podcast).where(Podcast.id == podcast_id))
    podcast = result.scalar_one_or_none()

    if not podcast:
        raise NotFoundException(f"Podcast '{podcast_id}' not found")

    return PodcastResponse.from_orm(podcast)


@router.get("", response_model=list[PodcastResponse])
async def list_podcasts(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> list[PodcastResponse]:
    """
    List all podcasts owned by the current user.
    """
    result = await db.execute(select(Podcast).where(Podcast.owner_id == current_user.id))
    podcasts = result.scalars().all()

    return [PodcastResponse.from_orm(p) for p in podcasts]


@router.put("/{podcast_id}", response_model=PodcastResponse)
async def update_podcast(
    podcast_id: str,
    podcast_data: PodcastUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> PodcastResponse:
    """
    Update podcast metadata.

    Only podcast owner can update.
    """
    # Fetch podcast
    result = await db.execute(select(Podcast).where(Podcast.id == podcast_id))
    podcast = result.scalar_one_or_none()

    if not podcast:
        raise NotFoundException(f"Podcast '{podcast_id}' not found")

    # Check ownership
    if podcast.owner_id != current_user.id:
        raise UnauthorizedException("Only podcast owner can update podcast")

    # Update fields
    if podcast_data.title is not None:
        podcast.title = podcast_data.title
    if podcast_data.description is not None:
        podcast.description = podcast_data.description
    if podcast_data.author is not None:
        podcast.author = podcast_data.author
    if podcast_data.category is not None:
        podcast.category = podcast_data.category
    if podcast_data.language is not None:
        podcast.language = podcast_data.language
    if podcast_data.artwork_url is not None:
        podcast.artwork_url = podcast_data.artwork_url

    await db.commit()
    await db.refresh(podcast)

    return PodcastResponse.from_orm(podcast)


@router.delete("/{podcast_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_podcast(
    podcast_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
) -> None:
    """
    Delete a podcast (owner only).

    Also deletes all related episodes, audio files, and artwork.
    """
    # Fetch podcast
    result = await db.execute(select(Podcast).where(Podcast.id == podcast_id))
    podcast = result.scalar_one_or_none()

    if not podcast:
        raise NotFoundException(f"Podcast '{podcast_id}' not found")

    # Check ownership
    if podcast.owner_id != current_user.id:
        raise UnauthorizedException("Only podcast owner can delete podcast")

    # Delete podcast (cascade deletes related records)
    await db.delete(podcast)
    await db.commit()
