"""
RefreshToken Repository - Token family operations for rotation and replay detection
"""
from typing import Optional, List
from datetime import datetime
from sqlmodel import Session, select, and_

from app.models.usuario import RefreshToken
from app.repositories.base import BaseRepository


class RefreshTokenRepository(BaseRepository[RefreshToken]):
    """Repository for refresh token operations with token family support"""
    
    def __init__(self, session: Session):
        super().__init__(RefreshToken, session)
    
    def get_by_token_hash(self, token_hash: str) -> Optional[RefreshToken]:
        """Get refresh token by its hash"""
        query = select(RefreshToken).where(
            and_(
                RefreshToken.token_hash == token_hash,
                RefreshToken.revocado_en == None
            )
        )
        return self.session.exec(query).first()
    
    def get_latest_by_family(self, usuario_id: int, family_id: str) -> Optional[RefreshToken]:
        """Get the latest (highest generation) token in a family"""
        query = select(RefreshToken).where(
            and_(
                RefreshToken.usuario_id == usuario_id,
                RefreshToken.family_id == family_id,
                RefreshToken.revocado_en == None
            )
        ).order_by(RefreshToken.generacion.desc())
        return self.session.exec(query).first()
    
    def get_all_by_family(self, family_id: str) -> List[RefreshToken]:
        """Get all tokens in a family (including revoked)"""
        query = select(RefreshToken).where(
            RefreshToken.family_id == family_id
        ).order_by(RefreshToken.generacion.desc())
        return list(self.session.exec(query).all())
    
    def get_active_by_user(self, usuario_id: int) -> List[RefreshToken]:
        """Get all active (non-revoked) refresh tokens for a user"""
        query = select(RefreshToken).where(
            and_(
                RefreshToken.usuario_id == usuario_id,
                RefreshToken.revocado_en == None,
                RefreshToken.expira_en > datetime.utcnow()
            )
        ).order_by(RefreshToken.generacion.desc())
        return list(self.session.exec(query).all())
    
    def revoke_family(self, family_id: str) -> int:
        """Revoke all tokens in a family - returns count of revoked tokens"""
        query = select(RefreshToken).where(
            and_(
                RefreshToken.family_id == family_id,
                RefreshToken.revocado_en == None
            )
        )
        tokens = list(self.session.exec(query).all())
        
        now = datetime.utcnow()
        for token in tokens:
            token.revocado_en = now
        
        self.session.flush()
        return len(tokens)
    
    def mark_used(self, token_id: int, timestamp: datetime = None) -> Optional[RefreshToken]:
        """Mark a token as used (for rate limiting check)"""
        if timestamp is None:
            timestamp = datetime.utcnow()
        
        token = self.get_by_id(token_id, include_deleted=True)
        if token:
            token.usado_en = timestamp
            self.session.flush()
            self.session.refresh(token)
        return token
    
    def revoke_user_tokens(self, usuario_id: int) -> int:
        """Revoke all refresh tokens for a user (for logout)"""
        query = select(RefreshToken).where(
            and_(
                RefreshToken.usuario_id == usuario_id,
                RefreshToken.revocado_en == None
            )
        )
        tokens = list(self.session.exec(query).all())
        
        now = datetime.utcnow()
        for token in tokens:
            token.revocado_en = now
        
        self.session.flush()
        return len(tokens)
    
    def cleanup_expired(self) -> int:
        """Remove expired tokens from database - returns count deleted"""
        query = select(RefreshToken).where(
            RefreshToken.expira_en < datetime.utcnow()
        )
        tokens = list(self.session.exec(query).all())
        
        for token in tokens:
            self.session.delete(token)
        
        self.session.flush()
        return len(tokens)