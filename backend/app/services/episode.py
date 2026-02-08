"""Episode business logic service."""

from sqlalchemy.orm import Session

from app.core.logging import get_logger
from app.models.base import Episode, Podcast

logger = get_logger(__name__)


class EpisodeService:
    """Business logic for episode management."""

    @staticmethod
    def create_episode(
        db: Session,
        podcast_id: str,
        title: str,
        description: str,
        episode_number: int | None = None,
        published_at=None,
        duration_seconds: int | None = None,
    ) -> Episode:
        """
        Create a new episode.

        Args:
            db: Database session
            podcast_id: Podcast ID
            title: Episode title
            description: Episode description
            episode_number: Episode number (optional)
            published_at: Publishing datetime (optional)
            duration_seconds: Episode duration in seconds (optional)

        Returns:
            Created Episode object

        Raises:
            ValueError: If podcast doesn't exist
        """
        # Verify podcast exists
        podcast = db.query(Podcast).filter(Podcast.id == podcast_id).first()
        if not podcast:
            raise ValueError(f"Podcast {podcast_id} not found")

        episode = Episode(
            podcast_id=podcast_id,
            title=title,
            description=description,
            episode_number=episode_number,
            published_at=published_at,
            duration_seconds=duration_seconds,
        )

        db.add(episode)
        db.flush()
        logger.info(f"Created episode {episode.id} for podcast {podcast_id}: {title}")

        return episode

    @staticmethod
    def get_episode_by_id(db: Session, episode_id: str) -> Episode | None:
        """
        Retrieve an episode by ID.

        Args:
            db: Database session
            episode_id: Episode ID

        Returns:
            Episode object or None if not found
        """
        return db.query(Episode).filter(Episode.id == episode_id).first()

    @staticmethod
    def list_episodes_by_podcast(db: Session, podcast_id: str, sort_by: str = "episode_number") -> list[Episode]:
        """
        List all episodes for a podcast.

        Args:
            db: Database session
            podcast_id: Podcast ID
            sort_by: Sort field (default: episode_number DESC)

        Returns:
            List of Episode objects
        """
        query = db.query(Episode).filter(Episode.podcast_id == podcast_id)

        if sort_by == "episode_number":
            query = query.order_by(Episode.episode_number.desc())
        elif sort_by == "published_at":
            query = query.order_by(Episode.published_at.desc())
        elif sort_by == "created_at":
            query = query.order_by(Episode.created_at.desc())

        return query.all()

    @staticmethod
    def update_episode(
        db: Session,
        episode_id: str,
        title: str | None = None,
        description: str | None = None,
        episode_number: int | None = None,
        published_at=None,
        duration_seconds: int | None = None,
        is_published: bool | None = None,
    ) -> Episode:
        """
        Update an episode.

        Args:
            db: Database session
            episode_id: Episode ID
            title: New title (optional)
            description: New description (optional)
            episode_number: New episode number (optional)
            published_at: New publish date (optional)
            duration_seconds: New duration (optional)
            is_published: Publish status (optional)

        Returns:
            Updated Episode object

        Raises:
            ValueError: If episode doesn't exist
        """
        episode = db.query(Episode).filter(Episode.id == episode_id).first()
        if not episode:
            raise ValueError(f"Episode {episode_id} not found")

        if title is not None:
            episode.title = title
        if description is not None:
            episode.description = description
        if episode_number is not None:
            episode.episode_number = episode_number
        if published_at is not None:
            episode.published_at = published_at
        if duration_seconds is not None:
            episode.duration_seconds = duration_seconds
        if is_published is not None:
            episode.is_published = is_published

        db.flush()
        logger.info(f"Updated episode {episode_id}")

        return episode

    @staticmethod
    def delete_episode(db: Session, episode_id: str) -> bool:
        """
        Delete an episode.

        Args:
            db: Database session
            episode_id: Episode ID

        Returns:
            True if deleted, False if not found
        """
        episode = db.query(Episode).filter(Episode.id == episode_id).first()
        if not episode:
            return False

        db.delete(episode)
        db.flush()
        logger.info(f"Deleted episode {episode_id}")

        return True

    @staticmethod
    def count_episodes_by_podcast(db: Session, podcast_id: str) -> int:
        """
        Count total episodes for a podcast.

        Args:
            db: Database session
            podcast_id: Podcast ID

        Returns:
            Episode count
        """
        return db.query(Episode).filter(Episode.podcast_id == podcast_id).count()

    @staticmethod
    def get_latest_episode(db: Session, podcast_id: str) -> Episode | None:
        """
        Get the latest episode by publish date.

        Args:
            db: Database session
            podcast_id: Podcast ID

        Returns:
            Latest Episode or None
        """
        return db.query(Episode).filter(Episode.podcast_id == podcast_id).order_by(Episode.published_at.desc()).first()
