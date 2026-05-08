"""
Tests for authentication endpoints and services
"""
import pytest
from fastapi.testclient import TestClient


class TestRegistration:
    """Test user registration"""
    
    def test_successful_registration(self, client: TestClient):
        """Test successful user registration returns 201 with tokens"""
        response = client.post(
            "/api/v1/auth/register",
            json={
                "nombre": "New User",
                "email": "newuser@example.com",
                "password": "SecurePassword123",
                "telefono": "+123456789",
            },
        )
        
        assert response.status_code == 201
        data = response.json()
        
        # Check tokens are present
        assert "tokens" in data
        assert "access_token" in data["tokens"]
        assert "refresh_token" in data["tokens"]
        assert data["tokens"]["token_type"] == "Bearer"
        assert data["tokens"]["expires_in"] > 0
        
        # Check user data
        assert "user" in data
        assert data["user"]["email"] == "newuser@example.com"
        assert data["user"]["nombre"] == "New User"
        assert len(data["user"]["roles"]) == 1
        assert data["user"]["roles"][0]["nombre"] == "CLIENT"
    
    def test_registration_duplicate_email(self, client: TestClient, test_user):
        """Test registration with duplicate email returns 409"""
        response = client.post(
            "/api/v1/auth/register",
            json={
                "nombre": "Another User",
                "email": "test@example.com",  # Already exists
                "password": "SecurePassword123",
            },
        )
        
        assert response.status_code == 409
        data = response.json()
        assert "already registered" in data["detail"].lower()
    
    def test_registration_weak_password(self, client: TestClient):
        """Test registration with password < 8 chars returns 422"""
        response = client.post(
            "/api/v1/auth/register",
            json={
                "nombre": "New User",
                "email": "weak@example.com",
                "password": "weak",  # Too short
            },
        )
        
        assert response.status_code == 422
    
    def test_registration_invalid_email(self, client: TestClient):
        """Test registration with invalid email returns 422"""
        response = client.post(
            "/api/v1/auth/register",
            json={
                "nombre": "New User",
                "email": "invalid-email",  # Invalid format
                "password": "SecurePassword123",
            },
        )
        
        assert response.status_code == 422


class TestLogin:
    """Test user login"""
    
    def test_successful_login(self, client: TestClient, test_user):
        """Test successful login returns 200 with tokens"""
        response = client.post(
            "/api/v1/auth/login",
            json={
                "email": "test@example.com",
                "password": "TestPassword123",
            },
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Check tokens
        assert "tokens" in data
        assert "access_token" in data["tokens"]
        assert "refresh_token" in data["tokens"]
        
        # Check user data
        assert data["user"]["email"] == "test@example.com"
        assert data["user"]["nombre"] == "Test User"
    
    def test_login_invalid_email(self, client: TestClient):
        """Test login with non-existent email returns 401"""
        response = client.post(
            "/api/v1/auth/login",
            json={
                "email": "nonexistent@example.com",
                "password": "SomePassword123",
            },
        )
        
        assert response.status_code == 401
        assert "invalid credentials" in response.json()["detail"].lower()
    
    def test_login_invalid_password(self, client: TestClient, test_user):
        """Test login with wrong password returns 401"""
        response = client.post(
            "/api/v1/auth/login",
            json={
                "email": "test@example.com",
                "password": "WrongPassword123",
            },
        )
        
        assert response.status_code == 401
        assert "invalid credentials" in response.json()["detail"].lower()
    
    def test_login_same_error_for_wrong_email_or_password(
        self, client: TestClient, test_user
    ):
        """Test that login error message is the same for wrong email or password"""
        # Wrong email
        response1 = client.post(
            "/api/v1/auth/login",
            json={
                "email": "wrong@example.com",
                "password": "TestPassword123",
            },
        )
        
        # Wrong password
        response2 = client.post(
            "/api/v1/auth/login",
            json={
                "email": "test@example.com",
                "password": "WrongPassword123",
            },
        )
        
        # Both should be 401 with same message
        assert response1.status_code == 401
        assert response2.status_code == 401
        assert response1.json()["detail"] == response2.json()["detail"]


class TestRefresh:
    """Test token refresh"""
    
    def test_successful_refresh(self, client: TestClient, test_user):
        """Test successful token refresh returns new tokens"""
        # Login to get tokens
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "email": "test@example.com",
                "password": "TestPassword123",
            },
        )
        
        refresh_token = login_response.json()["tokens"]["refresh_token"]
        
        # Refresh
        response = client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": refresh_token},
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Should get new tokens
        assert "access_token" in data
        assert "refresh_token" in data
        # New refresh token should be different
        assert data["refresh_token"] != refresh_token
    
    def test_refresh_invalid_token(self, client: TestClient):
        """Test refresh with invalid token returns 401"""
        response = client.post(
            "/api/v1/auth/refresh",
            json={"refresh_token": "invalid-token-uuid"},
        )
        
        assert response.status_code == 401


class TestLogout:
    """Test logout"""
    
    def test_successful_logout(self, client: TestClient, test_user):
        """Test successful logout returns 204"""
        # Login
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "email": "test@example.com",
                "password": "TestPassword123",
            },
        )
        
        refresh_token = login_response.json()["tokens"]["refresh_token"]
        
        # Logout
        response = client.post(
            "/api/v1/auth/logout",
            json={"refresh_token": refresh_token},
        )
        
        assert response.status_code == 204
    
    def test_logout_invalid_token(self, client: TestClient):
        """Test logout with invalid token returns 401"""
        response = client.post(
            "/api/v1/auth/logout",
            json={"refresh_token": "invalid-token-uuid"},
        )
        
        assert response.status_code == 401


class TestGetMe:
    """Test get current user endpoint"""
    
    def test_get_me_with_valid_token(self, client: TestClient, test_user):
        """Test getting current user with valid token"""
        # Login to get token
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "email": "test@example.com",
                "password": "TestPassword123",
            },
        )
        
        access_token = login_response.json()["tokens"]["access_token"]
        
        # Get me
        response = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {access_token}"},
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "test@example.com"
        assert data["nombre"] == "Test User"
    
    def test_get_me_without_token(self, client: TestClient):
        """Test getting current user without token returns 403"""
        response = client.get("/api/v1/auth/me")
        
        assert response.status_code == 403
    
    def test_get_me_with_invalid_token(self, client: TestClient):
        """Test getting current user with invalid token returns 403"""
        response = client.get(
            "/api/v1/auth/me",
            headers={"Authorization": "Bearer invalid-token"},
        )
        
        assert response.status_code == 403
