"""Podcast service - business logic for podcast management."""

from uuid import uuid4
from typing import Optional, List

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.base import Podcast, User, Episode
from app.core.errors import NotFoundException, UnauthorizedException
from app.lib.validators import PodcastCreate, PodcastUpdate


class PodcastService:
    """Service for podcast business logic."""

    @staticmethod
    async def create_podcast(
        podcast_data: PodcastCreate,
        owner: User,
        db: AsyncSession,
    ) -> Podcast:
        """Create a new podcast."""
        feed_url = f"podcast-{uuid4().hex[:8]}"

        podcast = Podcast(
            id=str(uuid4()),
            owner_id=owner.id,
            title=podcast_data.title,
            description=podcast_data.description,
            author=podcast_data.author or owner.full_name,
            category=podcast_data.category,
            language=podcast_data.language,
            feed_url=feed_url,
            is_published=False,
        )

        db.add(podcast)
        await db.commit()
        await db.refresh(podcast)
        return podcast

    @staticmethod
    async def get_podcast(
        podcast_id: str,
        db: AsyncSession,
    ) -> Optional[Podcast]:
        """Get podcast by ID."""
        result = await db.execute(select(Podcast).where(Podcast.id == podcast_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def get_user_podcasts(
        user_id: str,
        db: AsyncSession,
    ) -> List[Podcast]:
        """Get all podcasts owned by a user."""
        result = await db.execute(select(Podcast).where(Podcast.owner_id == user_id))
        return result.scalars().all()

    @staticmethod
    async def update_podcast(
        podcast_id: str,
        podcast_data: PodcastUpdate,
        owner: User,
        db: AsyncSession,
    ) -> Podcast:
        """Update podcast metadata."""
        podcast = await PodcastService.get_podcast(podcast_id, db)

        if not podcast:
            raise NotFoundException(f"Podcast '{podcast_id}' not found")

        if podcast.owner_id != owner.id:
            raise UnauthorizedException("Only podcast owner can update podcast")

        # Update fields
        update_data = podcast_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(podcast, field, value)

        await db.commit()
        await db.refresh(podcast)
        return podcast

    @staticmethod
    async def delete_podcast(
        podcast_id: str,
        owner: User,
        db: AsyncSession,
    ) -> None:
        """Delete a podcast and all related records."""
        podcast = await PodcastService.get_podcast(podcast_id, db)

        if not podcast:
            raise NotFoundException(f"Podcast '{podcast_id}' not found")

        if podcast.owner_id != owner.id:
            raise UnauthorizedException("Only podcast owner can delete podcast")

        await db.delete(podcast)
        await db.commit()

    @staticmethod
    async def get_podcast_episode_count(
        podcast_id: str,
        db: AsyncSession,
    ) -> int:
        """Get number of episodes in a podcast."""
        result = await db.execute(select(Episode).where(Episode.podcast_id == podcast_id))
        episodes = result.scalars().all()
        return len(episodes)

    @staticmethod
    async def publish_podcast(
        podcast_id: str,
        owner: User,
        db: AsyncSession,
    ) -> Podcast:
        """Publish a podcast (make it public)."""
        podcast = await PodcastService.get_podcast(podcast_id, db)

        if not podcast:
            raise NotFoundException(f"Podcast '{podcast_id}' not found")

        if podcast.owner_id != owner.id:
            raise UnauthorizedException("Only podcast owner can publish podcast")

        podcast.is_published = True
        await db.commit()
        await db.refresh(podcast)
        return podcast

    @staticmethod
    async def unpublish_podcast(
        podcast_id: str,
        owner: User,
        db: AsyncSession,
    ) -> Podcast:
        """Unpublish a podcast (make it private)."""
        podcast = await PodcastService.get_podcast(podcast_id, db)

        if not podcast:
            raise NotFoundException(f"Podcast '{podcast_id}' not found")

        if podcast.owner_id != owner.id:
            raise UnauthorizedException("Only podcast owner can unpublish podcast")

        podcast.is_published = False
        await db.commit()
        await db.refresh(podcast)
        return podcast
