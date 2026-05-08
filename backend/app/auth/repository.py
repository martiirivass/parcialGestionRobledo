"""
Auth Repository - Data access for authentication operations
"""
from typing import Optional
from datetime import datetime
from sqlmodel import Session, select
from app.repositories.base import BaseRepository
from app.models.usuario import Usuario, RefreshToken


class UsuarioRepository(BaseRepository[Usuario]):
    """Repository for Usuario model operations"""
    
    def __init__(self, session: Session):
        super().__init__(Usuario, session)
    
    def find_by_email(self, email: str, include_deleted: bool = False) -> Optional[Usuario]:
        """Find a user by email address"""
        query = select(Usuario).where(Usuario.email == email)
        if not include_deleted:
            query = query.where(Usuario.eliminado_en == None)
        return self.session.exec(query).first()
    
    def email_exists(self, email: str) -> bool:
        """Check if an email already exists"""
        return self.find_by_email(email) is not None


class RefreshTokenRepository(BaseRepository[RefreshToken]):
    """Repository for RefreshToken model operations"""
    
    def __init__(self, session: Session):
        super().__init__(RefreshToken, session)
    
    def find_by_token(self, token: str) -> Optional[RefreshToken]:
        """Find a refresh token by its UUID value"""
        query = select(RefreshToken).where(RefreshToken.token == token)
        return self.session.exec(query).first()
    
    def find_active_by_user(self, usuario_id: int) -> list[RefreshToken]:
        """Find all active (not revoked and not expired) tokens for a user"""
        now = datetime.utcnow()
        query = select(RefreshToken).where(
            (RefreshToken.usuario_id == usuario_id) &
            (RefreshToken.revocado_en == None) &
            (RefreshToken.expira_en > now)
        )
        return list(self.session.exec(query).all())
    
    def revoke_token(self, token_id: int) -> Optional[RefreshToken]:
        """Mark a refresh token as revoked"""
        token = self.get_by_id(token_id)
        if token:
            token.revocado_en = datetime.utcnow()
            self.session.flush()
            self.session.refresh(token)
        return token
    
    def revoke_all_for_user(self, usuario_id: int) -> int:
        """Revoke all tokens for a user (replay attack detection)"""
        now = datetime.utcnow()
        tokens = self.session.exec(
            select(RefreshToken).where(
                (RefreshToken.usuario_id == usuario_id) &
                (RefreshToken.revocado_en == None)
            )
        ).all()
        
        for token in tokens:
            token.revocado_en = now
        
        self.session.flush()
        return len(tokens)
    
    def is_token_valid(self, token_str: str) -> bool:
        """Check if a token exists, is not revoked, and not expired"""
        token = self.find_by_token(token_str)
        if not token:
            return False
        
        if token.revocado_en is not None:
            return False
        
        if datetime.utcnow() > token.expira_en:
            return False
        
        return True
