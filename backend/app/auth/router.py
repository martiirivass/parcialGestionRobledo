"""
Auth Router - Authentication endpoints
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session

from app.core.database import get_session_context
from app.core.config import settings
from app.main import limiter
from app.core.dependencies import get_current_user
from app.auth.schemas import (
    LoginRequest,
    RegisterRequest,
    RefreshTokenRequest,
    LogoutRequest,
    AuthResponse,
    TokenResponse,
    UserResponse,
    ErrorResponse,
)
from app.auth.service import AuthService
from app.models.usuario import Usuario


router = APIRouter()


@router.post(
    "/register",
    response_model=AuthResponse,
    status_code=201,
    responses={
        409: {"model": ErrorResponse, "description": "Email already exists"},
        422: {"model": ErrorResponse, "description": "Validation error"},
    },
)
async def register(
    request: RegisterRequest,
    session: Session = Depends(get_session_context),
):
    """
    Register a new user account.
    
    - Automatically assigns CLIENT role to new users
    - Password must be at least 8 characters
    - Email must be unique
    - Returns access and refresh tokens on success
    
    **Security Rules:**
    - Passwords are hashed with bcrypt (cost >= 10)
    - Access tokens expire in 30 minutes
    - Refresh tokens expire in 7 days
    """
    try:
        service = AuthService(session)
        auth_response = service.register_user(request)
        session.commit()
        return auth_response
    except ValueError as e:
        if "already registered" in str(e):
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email already registered",
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e),
        )
    except Exception as e:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during registration",
        )


@router.post(
    "/login",
    response_model=AuthResponse,
    responses={
        401: {"model": ErrorResponse, "description": "Invalid credentials"},
        429: {"model": ErrorResponse, "description": "Rate limit exceeded"},
    },
)
@limiter.limit(f"{settings.rate_limit_login}/15 minutes")
async def login(
    request: LoginRequest,
    session: Session = Depends(get_session_context),
):
    """
    Login with email and password.
    
    Returns JWT access token (30 min) and refresh token (7 days).
    
    **Security Rules:**
    - Rate limited to 5 attempts per 15 minutes per IP
    - Error message does NOT distinguish between wrong email and wrong password
    - Prevents email enumeration attacks
    """
    try:
        service = AuthService(session)
        auth_response = service.login_user(request)
        session.commit()
        return auth_response
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials",
        )
    except Exception as e:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during login",
        )


@router.post(
    "/refresh",
    response_model=TokenResponse,
    responses={
        401: {"model": ErrorResponse, "description": "Invalid or expired token"},
    },
)
async def refresh(
    request: RefreshTokenRequest,
    session: Session = Depends(get_session_context),
):
    """
    Refresh an expired access token using a refresh token.
    
    Implements token rotation: the old refresh token is revoked and a new one is issued.
    
    **Security Rules:**
    - Refresh tokens are stored in the database and can be revoked
    - Replay attack detection: if a revoked token is used, all tokens for that user are revoked
    - New access token expires in 30 minutes
    - New refresh token expires in 7 days
    """
    try:
        service = AuthService(session)
        tokens = service.refresh_access_token(request)
        session.commit()
        return tokens
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
        )
    except Exception as e:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during token refresh",
        )


@router.post(
    "/logout",
    status_code=204,
    responses={
        401: {"model": ErrorResponse, "description": "Invalid token"},
    },
)
async def logout(
    request: LogoutRequest,
    session: Session = Depends(get_session_context),
):
    """
    Logout and revoke a refresh token.
    
    This endpoint invalidates the refresh token, forcing the user to re-login
    to obtain new tokens.
    """
    try:
        service = AuthService(session)
        success = service.logout_user(request.refresh_token)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token",
            )
        
        session.commit()
        return None
    except HTTPException:
        raise
    except Exception as e:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred during logout",
        )


@router.get(
    "/me",
    response_model=UserResponse,
    responses={
        401: {"model": ErrorResponse, "description": "Unauthorized"},
    },
)
async def get_me(
    current_user: Usuario = Depends(get_current_user),
):
    """
    Get the current authenticated user's profile.
    
    Requires a valid JWT access token in the Authorization header.
    """
    return current_user