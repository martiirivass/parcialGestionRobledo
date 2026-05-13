"""
Auth Service - Business logic for authentication
"""
from datetime import datetime, timedelta
from typing import Optional, Tuple
from sqlmodel import Session

from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_access_token,
    hash_token,
    verify_token_hash,
)
from app.core.config import settings
from app.models.usuario import Usuario, Rol, UsuarioRol, RefreshToken
from app.auth.repository import UsuarioRepository, RefreshTokenRepository
from app.auth.schemas import (
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
    AuthResponse,
    RefreshTokenRequest,
)


class AuthService:
    """Service for authentication operations"""
    
    def __init__(self, session: Session):
        self.session = session
        self.usuario_repo = UsuarioRepository(session)
        self.token_repo = RefreshTokenRepository(session)
    
    def register_user(self, data: RegisterRequest) -> AuthResponse:
        """
        Register a new user with automatic CLIENT role assignment.
        
        Raises:
            ValueError: If email already exists
        """
        # Check email uniqueness
        if self.usuario_repo.email_exists(data.email):
            raise ValueError("Email already registered")
        
        # Create user with hashed password
        usuario = Usuario(
            nombre=data.nombre,
            email=data.email,
            password_hash=hash_password(data.password),
            telefono=data.telefono,
        )
        self.usuario_repo.create(usuario)
        
        # Assign CLIENT role (id=4)
        client_role = self.session.query(Rol).filter(Rol.id == 4).first()
        if client_role:
            usuario_rol = UsuarioRol(
                usuario_id=usuario.id,
                rol_id=client_role.id,
            )
            self.session.add(usuario_rol)
            self.session.flush()
        
        # Reload usuario with roles
        self.session.refresh(usuario)
        
        # Generate tokens
        tokens = self._generate_tokens(usuario)
        
        return AuthResponse(
            user=UserResponse.model_validate(usuario),
            tokens=tokens,
        )
    
    def login_user(self, data: LoginRequest) -> AuthResponse:
        """
        Authenticate a user and generate tokens.
        
        Raises:
            ValueError: If credentials are invalid
        """
        # Find user by email (don't distinguish between missing user and wrong password)
        usuario = self.usuario_repo.find_by_email(data.email)
        
        if not usuario or not verify_password(data.password, usuario.password_hash):
            raise ValueError("Invalid credentials")
        
        # Reload with roles
        self.session.refresh(usuario)
        
        # Generate tokens (new family for each login)
        tokens = self._generate_tokens(usuario)
        
        return AuthResponse(
            user=UserResponse.model_validate(usuario),
            tokens=tokens,
        )
    
    def refresh_access_token(self, data: RefreshTokenRequest) -> TokenResponse:
        """
        Refresh an access token using a refresh token.
        Implements token rotation with family-based replay attack detection.
        
        Raises:
            ValueError: If token is invalid, revoked, expired, or replay detected
        """
        # Hash the incoming token to look it up
        from app.core.security import hash_token
        token_hash = hash_token(data.refresh_token)
        
        # Find token by hash
        refresh_token = self.token_repo.find_by_token_hash(token_hash)
        
        if not refresh_token:
            raise ValueError("Invalid refresh token")
        
        # Check if revoked
        if refresh_token.revocado_en is not None:
            # Replay attack detected - revoke entire family
            self.token_repo.revoke_family(refresh_token.family_id)
            self.session.commit()
            raise ValueError("Token was already used (replay attack detected)")
        
        # Check if expired
        if datetime.utcnow() > refresh_token.expira_en:
            raise ValueError("Refresh token has expired")
        
        # Check for replay attack: compare generation with latest in family
        latest_in_family = self.token_repo.get_latest_by_family(
            refresh_token.usuario_id, 
            refresh_token.family_id
        )
        
        if latest_in_family and refresh_token.generacion < latest_in_family.generacion:
            # Replay attack: old token used after newer one issued
            self.token_repo.revoke_family(refresh_token.family_id)
            self.session.commit()
            raise ValueError("Token reuse detected - all sessions revoked for security")
        
        # Check rate limiting (30 seconds between refreshes)
        if refresh_token.usado_en:
            time_since_last_use = (datetime.utcnow() - refresh_token.usado_en).total_seconds()
            if time_since_last_use < 30:
                raise ValueError("Rate limit: wait before refreshing again")
        
        # Mark token as used
        self.token_repo.mark_used(refresh_token.id)
        
        # Get user and their roles
        usuario = self.usuario_repo.get_by_id(refresh_token.usuario_id)
        if not usuario:
            raise ValueError("User not found")
        
        self.session.refresh(usuario)
        
        # Revoke old token
        refresh_token.revocado_en = datetime.utcnow()
        self.session.flush()
        
        # Create new tokens with same family (rotation)
        new_tokens = self._generate_tokens(usuario, family_id=refresh_token.family_id)
        
        self.session.commit()
        
        return new_tokens
    
    def logout_user(self, refresh_token_str: str) -> bool:
        """
        Logout a user by revoking their refresh token.
        
        Returns:
            True if successfully logged out, False if token not found
        """
        token = self.token_repo.find_by_token(refresh_token_str)
        
        if not token:
            return False
        
        token.revocado_en = datetime.utcnow()
        self.session.flush()
        
        return True
    
    def _generate_tokens(self, usuario: Usuario, family_id: str = None) -> TokenResponse:
        """
        Generate access and refresh tokens for a user.
        
        Args:
            usuario: The user to generate tokens for
            family_id: Optional family ID for token rotation. If None, creates new family.
        
        Returns:
            TokenResponse with access_token, refresh_token, etc.
        """
        import uuid
        
        # Build JWT payload with roles
        roles = [rol.rol.nombre for rol in usuario.roles]
        
        access_token_data = {
            "sub": str(usuario.id),
            "email": usuario.email,
            "roles": roles,
        }
        
        access_token = create_access_token(access_token_data)
        
        # Create refresh token in database with family support
        refresh_token_str = create_refresh_token()
        
        # Generate family_id if not provided (new login session)
        if family_id is None:
            family_id = str(uuid.uuid4())
        
        # Get current generation for this family
        latest_token = self.token_repo.get_latest_by_family(usuario.id, family_id)
        new_generation = (latest_token.generacion + 1) if latest_token else 1
        
        # Hash token before storing (security best practice)
        token_hash = hash_token(refresh_token_str)
        
        expires_at = datetime.utcnow() + timedelta(
            days=settings.refresh_token_expire_days
        )
        
        refresh_token_obj = RefreshToken(
            family_id=family_id,
            generacion=new_generation,
            token_hash=token_hash,
            usuario_id=usuario.id,
            expira_en=expires_at,
        )
        self.token_repo.create(refresh_token_obj)
        
        # Calculate access token expiry in seconds
        expires_in = settings.access_token_expire_minutes * 60
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token_str,
            token_type="Bearer",
            expires_in=expires_in,
        )
    
    def get_current_user_from_token(self, token: str) -> Optional[Usuario]:
        """Extract user from JWT token"""
        payload = decode_access_token(token)
        
        if not payload:
            return None
        
        user_id = payload.get("sub")
        if not user_id:
            return None
        
        try:
            user_id = int(user_id)
        except (ValueError, TypeError):
            return None
        
        usuario = self.usuario_repo.get_by_id(user_id)
        if usuario:
            self.session.refresh(usuario)
        
        return usuario
