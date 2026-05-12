"""
Integration tests for Product API endpoints
"""
import pytest
from decimal import Decimal
from datetime import datetime
from fastapi.testclient import TestClient
from sqlmodel import Session, create_engine, SQLModel
from sqlalchemy.pool import StaticPool

from app.main import app
from app.core.database import get_session_context
from app.core.security import hash_password, create_access_token
from app.models.usuario import Usuario, Rol, UsuarioRol
from app.models.catalogo import Categoria, Ingrediente, Producto


@pytest.fixture(name="test_session")
def test_session_fixture():
    """Create test database session"""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    
    with Session(engine) as session:
        # Create roles
        roles_data = [
            {"id": 1, "nombre": "ADMIN", "descripcion": "Administrador"},
            {"id": 2, "nombre": "STOCK", "descripcion": "Gestor de stock"},
            {"id": 3, "nombre": "CLIENT", "descripcion": "Cliente"},
        ]
        for rol_data in roles_data:
            session.add(Rol(**rol_data))
        
        # Create categories
        cat1 = Categoria(id=1, nombre="Verduras")
        cat2 = Categoria(id=2, nombre="Frutas")
        session.add(cat1)
        session.add(cat2)
        
        # Create ingredients
        ing1 = Ingrediente(id=1, nombre="Tomate", es_alergeno=False)
        ing2 = Ingrediente(id=2, nombre="Cacahuete", es_alergeno=True)
        session.add(ing1)
        session.add(ing2)
        
        session.commit()
        
        yield session


@pytest.fixture(name="client")
def client_fixture(test_session: Session):
    """Create test client"""
    def get_session_override():
        return test_session
    
    app.dependency_overrides[get_session_context] = get_session_override
    
    with TestClient(app) as client:
        yield client
    
    app.dependency_overrides.clear()


@pytest.fixture(name="admin_user")
def admin_user_fixture(test_session: Session):
    """Create admin user with token"""
    user = Usuario(
        id=1,
        nombre="Admin User",
        email="admin@example.com",
        password_hash=hash_password("AdminPass123"),
        telefono="+123456789",
    )
    test_session.add(user)
    test_session.commit()
    
    # Assign ADMIN role
    admin_role = test_session.query(Rol).filter(Rol.id == 1).first()
    usuario_rol = UsuarioRol(usuario_id=user.id, rol_id=admin_role.id)
    test_session.add(usuario_rol)
    test_session.commit()
    
    test_session.refresh(user)
    
    token = create_access_token(data={"sub": str(user.id)})
    return {"user": user, "token": token}


@pytest.fixture(name="stock_user")
def stock_user_fixture(test_session: Session):
    """Create stock user with token"""
    user = Usuario(
        id=2,
        nombre="Stock User",
        email="stock@example.com",
        password_hash=hash_password("StockPass123"),
        telefono="+123456789",
    )
    test_session.add(user)
    test_session.commit()
    
    # Assign STOCK role
    stock_role = test_session.query(Rol).filter(Rol.id == 2).first()
    usuario_rol = UsuarioRol(usuario_id=user.id, rol_id=stock_role.id)
    test_session.add(usuario_rol)
    test_session.commit()
    
    test_session.refresh(user)
    
    token = create_access_token(data={"sub": str(user.id)})
    return {"user": user, "token": token}


class TestProductCreateEndpoint:
    """Test POST /api/v1/productos"""
    
    def test_create_product_admin(self, client: TestClient, admin_user: dict):
        """Test creating product as admin"""
        response = client.post(
            "/api/v1/productos",
            json={
                "nombre": "Tomate Fresco",
                "descripcion": "Tomate de alta calidad",
                "precio": "25.50",
                "stock": 100,
                "imagen_url": "https://example.com/tomate.jpg",
                "disponible": True,
                "categorias_ids": [1],
                "ingredientes_ids": [1]
            },
            headers={"Authorization": f"Bearer {admin_user['token']}"}
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["nombre"] == "Tomate Fresco"
        assert data["precio"] == "25.50"
        assert data["stock"] == 100
    
    def test_create_product_stock(self, client: TestClient, stock_user: dict):
        """Test creating product as stock user"""
        response = client.post(
            "/api/v1/productos",
            json={
                "nombre": "Zanahoria",
                "descripcion": None,
                "precio": "15.00",
                "stock": 50,
                "disponible": True
            },
            headers={"Authorization": f"Bearer {stock_user['token']}"}
        )
        
        assert response.status_code == 201
    
    def test_create_product_without_auth(self, client: TestClient):
        """Test that creating product without auth fails"""
        response = client.post(
            "/api/v1/productos",
            json={
                "nombre": "Producto",
                "precio": "20.00",
                "stock": 10,
                "disponible": True
            }
        )
        
        assert response.status_code == 401
    
    def test_create_product_invalid_price(self, client: TestClient, admin_user: dict):
        """Test that creating product with invalid price fails"""
        response = client.post(
            "/api/v1/productos",
            json={
                "nombre": "Producto",
                "precio": "0",
                "stock": 10,
                "disponible": True
            },
            headers={"Authorization": f"Bearer {admin_user['token']}"}
        )
        
        assert response.status_code == 400


class TestProductListEndpoint:
    """Test GET /api/v1/productos"""
    
    @pytest.fixture(autouse=True)
    def setup_products(self, test_session: Session):
        """Setup test products"""
        p1 = Producto(
            id=1,
            nombre="Tomate",
            precio=Decimal("25.50"),
            stock=100,
            disponible=True,
            eliminado_en=None
        )
        p2 = Producto(
            id=2,
            nombre="Zanahoria",
            precio=Decimal("15.00"),
            stock=50,
            disponible=True,
            eliminado_en=None
        )
        test_session.add(p1)
        test_session.add(p2)
        test_session.commit()
    
    def test_list_products(self, client: TestClient):
        """Test listing products"""
        response = client.get("/api/v1/productos")
        
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 2
        assert len(data["items"]) == 2
    
    def test_list_products_with_pagination(self, client: TestClient):
        """Test listing products with pagination"""
        response = client.get("/api/v1/productos?skip=0&limit=1")
        
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 2
        assert len(data["items"]) == 1
    
    def test_list_products_with_search(self, client: TestClient):
        """Test listing products with search"""
        response = client.get("/api/v1/productos?search=Tomate")
        
        assert response.status_code == 200
        data = response.json()
        assert data["total"] == 1
        assert data["items"][0]["nombre"] == "Tomate"


class TestProductDetailEndpoint:
    """Test GET /api/v1/productos/{product_id}"""
    
    @pytest.fixture(autouse=True)
    def setup_products(self, test_session: Session):
        """Setup test products"""
        p1 = Producto(
            id=1,
            nombre="Tomate",
            precio=Decimal("25.50"),
            stock=100,
            disponible=True,
            eliminado_en=None
        )
        test_session.add(p1)
        test_session.commit()
    
    def test_get_product(self, client: TestClient):
        """Test getting product details"""
        response = client.get("/api/v1/productos/1")
        
        assert response.status_code == 200
        data = response.json()
        assert data["nombre"] == "Tomate"
        assert data["precio"] == "25.50"
    
    def test_get_product_not_found(self, client: TestClient):
        """Test getting nonexistent product"""
        response = client.get("/api/v1/productos/999")
        
        assert response.status_code == 404


class TestProductUpdateEndpoint:
    """Test PUT /api/v1/productos/{product_id}"""
    
    @pytest.fixture(autouse=True)
    def setup_products(self, test_session: Session):
        """Setup test products"""
        p1 = Producto(
            id=1,
            nombre="Tomate",
            precio=Decimal("25.50"),
            stock=100,
            disponible=True,
            eliminado_en=None
        )
        test_session.add(p1)
        test_session.commit()
    
    def test_update_product_admin(self, client: TestClient, admin_user: dict):
        """Test updating product as admin"""
        response = client.put(
            "/api/v1/productos/1",
            json={
                "nombre": "Tomate Rojo",
                "precio": "30.00"
            },
            headers={"Authorization": f"Bearer {admin_user['token']}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["nombre"] == "Tomate Rojo"
        assert data["precio"] == "30.00"
    
    def test_update_product_without_auth(self, client: TestClient):
        """Test that updating product without auth fails"""
        response = client.put(
            "/api/v1/productos/1",
            json={"nombre": "Tomate Rojo"}
        )
        
        assert response.status_code == 401


class TestProductDeleteEndpoint:
    """Test DELETE /api/v1/productos/{product_id}"""
    
    @pytest.fixture(autouse=True)
    def setup_products(self, test_session: Session):
        """Setup test products"""
        p1 = Producto(
            id=1,
            nombre="Tomate",
            precio=Decimal("25.50"),
            stock=100,
            disponible=True,
            eliminado_en=None
        )
        test_session.add(p1)
        test_session.commit()
    
    def test_delete_product_admin(self, client: TestClient, admin_user: dict):
        """Test deleting product as admin"""
        response = client.delete(
            "/api/v1/productos/1",
            headers={"Authorization": f"Bearer {admin_user['token']}"}
        )
        
        assert response.status_code == 204
    
    def test_delete_product_without_auth(self, client: TestClient):
        """Test that deleting product without auth fails"""
        response = client.delete("/api/v1/productos/1")
        
        assert response.status_code == 401


class TestProductStockEndpoint:
    """Test PATCH /api/v1/productos/{product_id}/stock"""
    
    @pytest.fixture(autouse=True)
    def setup_products(self, test_session: Session):
        """Setup test products"""
        p1 = Producto(
            id=1,
            nombre="Tomate",
            precio=Decimal("25.50"),
            stock=100,
            disponible=True,
            eliminado_en=None
        )
        test_session.add(p1)
        test_session.commit()
    
    def test_increase_stock(self, client: TestClient, admin_user: dict):
        """Test increasing stock"""
        response = client.patch(
            "/api/v1/productos/1/stock",
            json={"cantidad": 50},
            headers={"Authorization": f"Bearer {admin_user['token']}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["stock"] == 150
    
    def test_decrease_stock(self, client: TestClient, admin_user: dict):
        """Test decreasing stock"""
        response = client.patch(
            "/api/v1/productos/1/stock",
            json={"cantidad": -30},
            headers={"Authorization": f"Bearer {admin_user['token']}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["stock"] == 70
