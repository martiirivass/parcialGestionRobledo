"""
Authentication dependencies for FastAPI
"""
from typing import List
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import Session, select

from app.core.database import get_session
from app.core.security import decode_access_token
from app.models.usuario import Usuario, Rol, UsuarioRol

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

# Session dependency
get_db = get_session


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    session: Session = Depends(get_db),
) -> Usuario:
    """Get current authenticated user from JWT token"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    # Decode token
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception
    
    # Check token type
    if payload.get("type") != "access":
        raise credentials_exception
    
    user_id: int = payload.get("sub")
    if user_id is None:
        raise credentials_exception
    
    # Get user from database
    user = session.exec(
        select(Usuario).where(Usuario.id == user_id)
    ).first()
    
    if user is None:
        raise credentials_exception
    
    # Check if user is not deleted
    if user.eliminado_en is not None:
        raise credentials_exception
    
    return user


def require_role(allowed_roles: List[str]):
    """Factory to create role requirement dependency"""
    async def _role_checker(
        current_user: Usuario = Depends(get_current_user),
        session: Session = Depends(get_db)
    ) -> Usuario:
        """Check if user has required role"""
        # Get user's roles with role names
        statement = (
            select(Rol.nombre)
            .join(UsuarioRol, UsuarioRol.rol_id == Rol.id)
            .where(UsuarioRol.usuario_id == current_user.id)
        )
        results = session.exec(statement).all()
        
        # Check if any allowed role matches
        for role in allowed_roles:
            if role in results:
                return current_user
        
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Requires one of roles: {', '.join(allowed_roles)}"
        )
    
    return _role_checker