"""Episode management routes."""

import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.lib.validators import EpisodeCreate, EpisodeUpdate
from app.models.base import Episode, Podcast, User

router = APIRouter(prefix="/api/shows", tags=["episodes"])


@router.post("/{show_id}/episodes")
async def create_episode(
    show_id: str,
    episode_data: EpisodeCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """
    Create a new episode for a podcast.

    Args:
        show_id: Podcast ID
        episode_data: Episode creation data (title, description, etc.)

    Returns:
        Episode metadata

    Raises:
        404: Podcast not found
        403: User doesn't have permission
    """
    # Verify podcast exists and user owns it
    podcast = db.query(Podcast).filter(Podcast.id == show_id).first()
    if not podcast:
        raise HTTPException(status_code=404, detail="Podcast not found")

    if podcast.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="You do not have permission to modify this podcast")

    # Create episode
    episode = Episode(
        id=str(uuid.uuid4()),
        podcast_id=show_id,
        title=episode_data.title,
        description=episode_data.description,
        episode_number=episode_data.episode_number,
        published_at=episode_data.published_at,
        duration_seconds=episode_data.duration_seconds,
        is_published=False,
    )

    db.add(episode)
    db.commit()
    db.refresh(episode)

    return {
        "id": episode.id,
        "podcast_id": episode.podcast_id,
        "title": episode.title,
        "description": episode.description,
        "episode_number": episode.episode_number,
        "published_at": episode.published_at,
        "duration_seconds": episode.duration_seconds,
        "is_published": episode.is_published,
        "created_at": episode.created_at,
        "updated_at": episode.updated_at,
    }


@router.get("/{show_id}/episodes/{episode_id}")
async def get_episode(
    show_id: str,
    episode_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """
    Retrieve a specific episode.

    Args:
        show_id: Podcast ID
        episode_id: Episode ID

    Returns:
        Episode metadata

    Raises:
        404: Podcast or episode not found
        403: User doesn't have permission
    """
    podcast = db.query(Podcast).filter(Podcast.id == show_id).first()
    if not podcast:
        raise HTTPException(status_code=404, detail="Podcast not found")

    if podcast.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="You do not have permission to view this podcast")

    episode = db.query(Episode).filter(Episode.id == episode_id, Episode.podcast_id == show_id).first()

    if not episode:
        raise HTTPException(status_code=404, detail="Episode not found")

    return {
        "id": episode.id,
        "podcast_id": episode.podcast_id,
        "title": episode.title,
        "description": episode.description,
        "episode_number": episode.episode_number,
        "published_at": episode.published_at,
        "duration_seconds": episode.duration_seconds,
        "is_published": episode.is_published,
        "created_at": episode.created_at,
        "updated_at": episode.updated_at,
    }


@router.get("/{show_id}/episodes")
async def list_episodes(
    show_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """
    List all episodes for a podcast.

    Args:
        show_id: Podcast ID

    Returns:
        List of episodes with pagination info

    Raises:
        404: Podcast not found
        403: User doesn't have permission
    """
    podcast = db.query(Podcast).filter(Podcast.id == show_id).first()
    if not podcast:
        raise HTTPException(status_code=404, detail="Podcast not found")

    if podcast.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="You do not have permission to view this podcast")

    episodes = db.query(Episode).filter(Episode.podcast_id == show_id).order_by(Episode.episode_number.desc()).all()

    return {
        "total": len(episodes),
        "episodes": [
            {
                "id": ep.id,
                "podcast_id": ep.podcast_id,
                "title": ep.title,
                "description": ep.description,
                "episode_number": ep.episode_number,
                "published_at": ep.published_at,
                "duration_seconds": ep.duration_seconds,
                "is_published": ep.is_published,
                "created_at": ep.created_at,
                "updated_at": ep.updated_at,
            }
            for ep in episodes
        ],
    }


@router.put("/{show_id}/episodes/{episode_id}")
async def update_episode(
    show_id: str,
    episode_id: str,
    episode_data: EpisodeUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> dict:
    """
    Update an episode.

    Args:
        show_id: Podcast ID
        episode_id: Episode ID
        episode_data: Episode update data

    Returns:
        Updated episode metadata

    Raises:
        404: Podcast or episode not found
        403: User doesn't have permission
    """
    podcast = db.query(Podcast).filter(Podcast.id == show_id).first()
    if not podcast:
        raise HTTPException(status_code=404, detail="Podcast not found")

    if podcast.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="You do not have permission to modify this podcast")

    episode = db.query(Episode).filter(Episode.id == episode_id, Episode.podcast_id == show_id).first()

    if not episode:
        raise HTTPException(status_code=404, detail="Episode not found")

    # Update only provided fields
    if episode_data.title is not None:
        episode.title = episode_data.title
    if episode_data.description is not None:
        episode.description = episode_data.description
    if episode_data.episode_number is not None:
        episode.episode_number = episode_data.episode_number
    if episode_data.published_at is not None:
        episode.published_at = episode_data.published_at
    if episode_data.duration_seconds is not None:
        episode.duration_seconds = episode_data.duration_seconds

    episode.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(episode)

    return {
        "id": episode.id,
        "podcast_id": episode.podcast_id,
        "title": episode.title,
        "description": episode.description,
        "episode_number": episode.episode_number,
        "published_at": episode.published_at,
        "duration_seconds": episode.duration_seconds,
        "is_published": episode.is_published,
        "created_at": episode.created_at,
        "updated_at": episode.updated_at,
    }
