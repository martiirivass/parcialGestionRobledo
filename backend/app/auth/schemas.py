"""
Auth Schemas - Request/Response models for authentication
"""
from pydantic import BaseModel, Field, EmailStr, validator
from typing import Optional, List
from datetime import datetime


# Request Schemas
class LoginRequest(BaseModel):
    """Login request with email and password"""
    email: EmailStr = Field(..., description="User email")
    password: str = Field(..., min_length=1, description="User password")
    
    class Config:
        json_schema_extra = {
            "example": {
                "email": "user@example.com",
                "password": "SecurePassword123!"
            }
        }


class RegisterRequest(BaseModel):
    """Register request with user details"""
    nombre: str = Field(..., min_length=3, max_length=255, description="User's full name")
    email: EmailStr = Field(..., description="User email (must be unique)")
    password: str = Field(..., min_length=8, description="Password (minimum 8 characters)")
    telefono: Optional[str] = Field(None, max_length=20, description="Optional phone number")
    
    @validator('password')
    def validate_password_strength(cls, v):
        """Validate password has minimum complexity"""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        return v
    
    class Config:
        json_schema_extra = {
            "example": {
                "nombre": "Juan Pérez",
                "email": "juan@example.com",
                "password": "SecurePassword123!",
                "telefono": "+5491234567890"
            }
        }


class RefreshTokenRequest(BaseModel):
    """Refresh token request"""
    refresh_token: str = Field(..., description="Refresh token (UUID)")
    
    class Config:
        json_schema_extra = {
            "example": {
                "refresh_token": "550e8400-e29b-41d4-a716-446655440000"
            }
        }


class LogoutRequest(BaseModel):
    """Logout request"""
    refresh_token: str = Field(..., description="Refresh token to revoke")
    
    class Config:
        json_schema_extra = {
            "example": {
                "refresh_token": "550e8400-e29b-41d4-a716-446655440000"
            }
        }


# Response Schemas
class TokenResponse(BaseModel):
    """Token response with access and refresh tokens"""
    access_token: str = Field(..., description="JWT access token (30 min expiry)")
    refresh_token: str = Field(..., description="Refresh token (7 day expiry)")
    token_type: str = Field("Bearer", description="Token type (always Bearer)")
    expires_in: int = Field(..., description="Access token expiry in seconds")
    
    class Config:
        json_schema_extra = {
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "refresh_token": "550e8400-e29b-41d4-a716-446655440000",
                "token_type": "Bearer",
                "expires_in": 1800
            }
        }


class RolResponse(BaseModel):
    """Role response"""
    id: int
    nombre: str
    descripcion: Optional[str] = None
    
    class Config:
        from_attributes = True


class UserResponse(BaseModel):
    """User response (public info only)"""
    id: int
    nombre: str
    email: str
    telefono: Optional[str] = None
    creado_en: datetime
    roles: List[RolResponse] = []
    
    class Config:
        from_attributes = True
        json_schema_extra = {
            "example": {
                "id": 1,
                "nombre": "Juan Pérez",
                "email": "juan@example.com",
                "telefono": "+5491234567890",
                "creado_en": "2026-05-08T12:00:00Z",
                "roles": [
                    {
                        "id": 4,
                        "nombre": "CLIENT",
                        "descripcion": "Cliente de la tienda"
                    }
                ]
            }
        }


class AuthResponse(BaseModel):
    """Full authentication response with tokens and user"""
    user: UserResponse
    tokens: TokenResponse
    
    class Config:
        json_schema_extra = {
            "example": {
                "user": {
                    "id": 1,
                    "nombre": "Juan Pérez",
                    "email": "juan@example.com",
                    "telefono": "+5491234567890",
                    "creado_en": "2026-05-08T12:00:00Z",
                    "roles": [
                        {
                            "id": 4,
                            "nombre": "CLIENT",
                            "descripcion": "Cliente de la tienda"
                        }
                    ]
                },
                "tokens": {
                    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                    "refresh_token": "550e8400-e29b-41d4-a716-446655440000",
                    "token_type": "Bearer",
                    "expires_in": 1800
                }
            }
        }


class ErrorResponse(BaseModel):
    """Standard error response (RFC 7807)"""
    type: str = Field(..., description="Error type URI")
    title: str = Field(..., description="Short error title")
    status: int = Field(..., description="HTTP status code")
    detail: str = Field(..., description="Error details")
    instance: Optional[str] = Field(None, description="Request URI")
    
    class Config:
        json_schema_extra = {
            "example": {
                "type": "about:blank",
                "title": "Unauthorized",
                "status": 401,
                "detail": "Invalid credentials",
                "instance": "/api/v1/auth/login"
            }
        }
