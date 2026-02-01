from enum import Enum
from typing import Optional

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.base import User, Podcast, TeamMember


class RoleEnum(str, Enum):
    """Role enumeration"""

    ADMIN = "admin"
    EDITOR = "editor"


async def check_podcast_ownership(
    user: User,
    podcast_id: str,
    db: AsyncSession,
) -> Podcast:
    """Check if user owns the podcast"""
    statement = select(Podcast).where((Podcast.id == podcast_id) & (Podcast.owner_id == user.id))
    result = await db.execute(statement)
    podcast = result.scalars().first()

    if not podcast:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this podcast",
        )
    return podcast


async def check_podcast_access(
    user: User,
    podcast_id: str,
    db: AsyncSession,
    required_role: Optional[RoleEnum] = None,
) -> Podcast:
    """Check if user has access to podcast (owner or team member)"""
    # Check ownership
    statement = select(Podcast).where(Podcast.id == podcast_id)
    result = await db.execute(statement)
    podcast = result.scalars().first()

    if not podcast:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Podcast not found",
        )

    # Check if owner
    if podcast.owner_id == user.id:
        return podcast

    # Check team membership
    team_member_statement = select(TeamMember).where(
        (TeamMember.podcast_id == podcast_id) & (TeamMember.user_id == user.id)
    )
    result = await db.execute(team_member_statement)
    team_member = result.scalars().first()

    if not team_member or not team_member.joined_at:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access this podcast",
        )

    # Check role if required
    if required_role and team_member.role != required_role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Role '{required_role}' is required to perform this action",
        )

    return podcast


async def check_episode_access(
    user: User,
    episode_id: str,
    db: AsyncSession,
    required_role: Optional[RoleEnum] = None,
):
    """Check if user has access to episode"""
    from app.models.base import Episode

    statement = select(Episode).where(Episode.id == episode_id)
    result = await db.execute(statement)
    episode = result.scalars().first()

    if not episode:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Episode not found",
        )

    # Check podcast access
    await check_podcast_access(user, episode.podcast_id, db, required_role)
    return episode


def is_admin_or_owner(user: User, podcast: Podcast) -> bool:
    """Check if user is admin or owner of podcast"""
    return user.id == podcast.owner_id
