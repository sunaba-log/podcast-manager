"""Test authentication endpoints."""

import pytest
from httpx import AsyncClient

from app.main import app


@pytest.mark.asyncio
async def test_register():
    """Test user registration."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        response = await client.post(
            "/api/auth/register",
            json={
                "email": "test@example.com",
                "username": "testuser",
                "password": "TestPassword123",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "test@example.com"
        assert data["username"] == "testuser"


@pytest.mark.asyncio
async def test_login():
    """Test user login."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        # Register first
        await client.post(
            "/api/auth/register",
            json={
                "email": "test@example.com",
                "username": "testuser",
                "password": "TestPassword123",
            },
        )

        # Login
        response = await client.post(
            "/api/auth/login",
            json={
                "email": "test@example.com",
                "password": "TestPassword123",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert data["user"]["email"] == "test@example.com"


@pytest.mark.asyncio
async def test_login_invalid_password():
    """Test login with invalid password."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        # Register first
        await client.post(
            "/api/auth/register",
            json={
                "email": "test@example.com",
                "username": "testuser",
                "password": "TestPassword123",
            },
        )

        # Login with wrong password
        response = await client.post(
            "/api/auth/login",
            json={
                "email": "test@example.com",
                "password": "WrongPassword123",
            },
        )
        assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_me():
    """Test getting current user."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        # Register and login
        await client.post(
            "/api/auth/register",
            json={
                "email": "test@example.com",
                "username": "testuser",
                "password": "TestPassword123",
            },
        )

        login_response = await client.post(
            "/api/auth/login",
            json={
                "email": "test@example.com",
                "password": "TestPassword123",
            },
        )
        token = login_response.json()["access_token"]

        # Get current user
        response = await client.get(
            "/api/auth/me",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "test@example.com"


@pytest.mark.asyncio
async def test_refresh_token():
    """Test token refresh."""
    async with AsyncClient(app=app, base_url="http://test") as client:
        # Register and login
        await client.post(
            "/api/auth/register",
            json={
                "email": "test@example.com",
                "username": "testuser",
                "password": "TestPassword123",
            },
        )

        login_response = await client.post(
            "/api/auth/login",
            json={
                "email": "test@example.com",
                "password": "TestPassword123",
            },
        )
        token = login_response.json()["access_token"]

        # Refresh token
        response = await client.post(
            "/api/auth/refresh",
            headers={"Authorization": f"Bearer {token}"},
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
