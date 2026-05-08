"""
Test configuration and fixtures for pytest
"""
import pytest
from sqlmodel import SQLModel, create_engine, Session
from sqlalchemy.pool import StaticPool
from fastapi.testclient import TestClient

from app.main import app
from app.core.database import get_session_context
from app.core.security import hash_password
from app.models.usuario import Usuario, Rol, UsuarioRol


@pytest.fixture(name="session")
def session_fixture():
    """Create an in-memory SQLite database for testing"""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    
    # Create all tables
    SQLModel.metadata.create_all(engine)
    
    # Create roles and test data
    with Session(engine) as session:
        # Create roles
        roles_data = [
            {"id": 1, "nombre": "ADMIN", "descripcion": "Administrador"},
            {"id": 2, "nombre": "STOCK", "descripcion": "Gestor de stock"},
            {"id": 3, "nombre": "PEDIDOS", "descripcion": "Gestor de pedidos"},
            {"id": 4, "nombre": "CLIENT", "descripcion": "Cliente"},
        ]
        for rol_data in roles_data:
            rol = Rol(**rol_data)
            session.add(rol)
        
        session.commit()
    
    yield session


@pytest.fixture(name="client")
def client_fixture(session: Session):
    """Create a test client with overridden database dependency"""
    def get_session_override():
        return session
    
    app.dependency_overrides[get_session_context] = get_session_override
    
    with TestClient(app) as client:
        yield client
    
    app.dependency_overrides.clear()


@pytest.fixture(name="test_user")
def test_user_fixture(session: Session):
    """Create a test user"""
    user = Usuario(
        nombre="Test User",
        email="test@example.com",
        password_hash=hash_password("TestPassword123"),
        telefono="+123456789",
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    
    # Assign CLIENT role
    client_role = session.query(Rol).filter(Rol.id == 4).first()
    usuario_rol = UsuarioRol(usuario_id=user.id, rol_id=client_role.id)
    session.add(usuario_rol)
    session.commit()
    
    session.refresh(user)
    return user
