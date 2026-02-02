from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Table, Text
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy.sql import func

Base = declarative_base()

# Association table for team members
podcast_team_association = Table(
    "podcast_team_association",
    Base.metadata,
    Column("podcast_id", String, ForeignKey("podcasts.id")),
    Column("team_member_id", String, ForeignKey("team_members.id")),
)


class User(Base):
    """User entity"""

    __tablename__ = "users"

    id = Column(String, primary_key=True)
    email = Column(String, unique=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    podcasts = relationship("Podcast", back_populates="owner")
    team_memberships = relationship("TeamMember", back_populates="user")

    def verify_password(self, password: str) -> bool:
        """Verify password against hash."""
        import bcrypt

        return bcrypt.checkpw(password.encode(), self.hashed_password.encode())


class Podcast(Base):
    """Podcast entity"""

    __tablename__ = "podcasts"

    id = Column(String, primary_key=True)
    owner_id = Column(String, ForeignKey("users.id"))
    title = Column(String, index=True)
    description = Column(Text)
    author = Column(String)
    category = Column(String)
    language = Column(String, default="ja")
    feed_url = Column(String, unique=True, index=True, nullable=True)
    artwork_url = Column(String, nullable=True)
    is_published = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    owner = relationship("User", back_populates="podcasts")
    episodes = relationship("Episode", back_populates="podcast", cascade="all, delete-orphan")
    artwork = relationship("Artwork", back_populates="podcast", uselist=False, cascade="all, delete-orphan")
    team_members = relationship("TeamMember", back_populates="podcast", cascade="all, delete-orphan")


class Episode(Base):
    """Episode entity"""

    __tablename__ = "episodes"

    id = Column(String, primary_key=True)
    podcast_id = Column(String, ForeignKey("podcasts.id"))
    title = Column(String, index=True)
    description = Column(Text)
    episode_number = Column(Integer, nullable=True)
    published_at = Column(DateTime, nullable=True)
    duration_seconds = Column(Integer, nullable=True)
    is_published = Column(Boolean, default=False)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    podcast = relationship("Podcast", back_populates="episodes")
    audio_file = relationship("AudioFile", back_populates="episode", uselist=False, cascade="all, delete-orphan")


class AudioFile(Base):
    """Audio File entity"""

    __tablename__ = "audio_files"

    id = Column(String, primary_key=True)
    episode_id = Column(String, ForeignKey("episodes.id"))
    filename = Column(String)
    gcs_url = Column(String)
    r2_url = Column(String, nullable=True)
    file_size = Column(Integer)
    mime_type = Column(String)
    duration_seconds = Column(Integer, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    episode = relationship("Episode", back_populates="audio_file")


class Artwork(Base):
    """Artwork/Cover image entity"""

    __tablename__ = "artworks"

    id = Column(String, primary_key=True)
    podcast_id = Column(String, ForeignKey("podcasts.id"))
    filename = Column(String)
    gcs_url = Column(String)
    width = Column(Integer)
    height = Column(Integer)
    file_size = Column(Integer)
    is_valid = Column(Boolean, default=False)
    validation_errors = Column(Text, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    podcast = relationship("Podcast", back_populates="artwork")


class TeamMember(Base):
    """Team Member entity (for collaborative editing)"""

    __tablename__ = "team_members"

    id = Column(String, primary_key=True)
    user_id = Column(String, ForeignKey("users.id"))
    podcast_id = Column(String, ForeignKey("podcasts.id"))
    role = Column(String, default="editor")  # admin, editor
    invited_at = Column(DateTime, server_default=func.now())
    joined_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    user = relationship("User", back_populates="team_memberships")
    podcast = relationship("Podcast", back_populates="team_members")
