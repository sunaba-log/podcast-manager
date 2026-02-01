"""Initial database schema with User, Podcast, Episode, AudioFile, Artwork, TeamMember tables.

Revision ID: 001
Revises:
Create Date: 2026-02-01 00:00:00.000000

"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic
revision = "001"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create users table
    op.create_table(
        "users",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("email", sa.String(), nullable=False),
        sa.Column("username", sa.String(), nullable=False),
        sa.Column("hashed_password", sa.String(), nullable=False),
        sa.Column("full_name", sa.String(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
        sa.UniqueConstraint("username"),
    )
    op.create_index("ix_users_email", "users", ["email"])
    op.create_index("ix_users_username", "users", ["username"])

    # Create podcasts table
    op.create_table(
        "podcasts",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("owner_id", sa.String(), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("author", sa.String(), nullable=True),
        sa.Column("category", sa.String(), nullable=True),
        sa.Column("language", sa.String(), nullable=False, server_default="ja"),
        sa.Column("feed_url", sa.String(), nullable=True),
        sa.Column("artwork_url", sa.String(), nullable=True),
        sa.Column("is_published", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["owner_id"], ["users.id"]),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_podcasts_title", "podcasts", ["title"])
    op.create_index("ix_podcasts_feed_url", "podcasts", ["feed_url"])

    # Create episodes table
    op.create_table(
        "episodes",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("podcast_id", sa.String(), nullable=False),
        sa.Column("title", sa.String(), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("episode_number", sa.Integer(), nullable=True),
        sa.Column("published_at", sa.DateTime(), nullable=True),
        sa.Column("duration_seconds", sa.Integer(), nullable=True),
        sa.Column("is_published", sa.Boolean(), nullable=False, server_default="false"),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["podcast_id"], ["podcasts.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_episodes_title", "episodes", ["title"])

    # Create audio_files table
    op.create_table(
        "audio_files",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("episode_id", sa.String(), nullable=False),
        sa.Column("filename", sa.String(), nullable=False),
        sa.Column("gcs_url", sa.String(), nullable=False),
        sa.Column("r2_url", sa.String(), nullable=True),
        sa.Column("file_size", sa.Integer(), nullable=False),
        sa.Column("mime_type", sa.String(), nullable=False),
        sa.Column("duration_seconds", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["episode_id"], ["episodes.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    # Create artworks table
    op.create_table(
        "artworks",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("podcast_id", sa.String(), nullable=False),
        sa.Column("filename", sa.String(), nullable=False),
        sa.Column("gcs_url", sa.String(), nullable=False),
        sa.Column("width", sa.Integer(), nullable=True),
        sa.Column("height", sa.Integer(), nullable=True),
        sa.Column("file_size", sa.Integer(), nullable=False),
        sa.Column("mime_type", sa.String(), nullable=False),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["podcast_id"], ["podcasts.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("podcast_id"),
    )

    # Create team_members table
    op.create_table(
        "team_members",
        sa.Column("id", sa.String(), nullable=False),
        sa.Column("user_id", sa.String(), nullable=False),
        sa.Column("podcast_id", sa.String(), nullable=False),
        sa.Column("role", sa.String(), nullable=False),
        sa.Column("invited_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("joined_at", sa.DateTime(), nullable=True),
        sa.Column("created_at", sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(), server_default=sa.func.now(), onupdate=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["podcast_id"], ["podcasts.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    # Create podcast_team_association table
    op.create_table(
        "podcast_team_association",
        sa.Column("podcast_id", sa.String(), nullable=False),
        sa.Column("team_member_id", sa.String(), nullable=False),
        sa.ForeignKeyConstraint(["podcast_id"], ["podcasts.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["team_member_id"], ["team_members.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("podcast_id", "team_member_id"),
    )


def downgrade() -> None:
    op.drop_table("podcast_team_association")
    op.drop_table("team_members")
    op.drop_table("artworks")
    op.drop_table("audio_files")
    op.drop_table("episodes")
    op.drop_table("podcasts")
    op.drop_index("ix_users_username")
    op.drop_index("ix_users_email")
    op.drop_table("users")
