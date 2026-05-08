"""
Integration tests for Category endpoints
"""
import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session

from app.models.usuario import Usuario, UsuarioRol
from app.models.catalogo import Categoria, Producto, ProductoCategoria
from app.core.security import hash_password, create_access_token


@pytest.fixture(name="admin_token")
def admin_token_fixture(session: Session):
    """Create admin user and return JWT token"""
    user = Usuario(
        nombre="Admin User",
        email="admin@example.com",
        password_hash=hash_password("AdminPassword123"),
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    
    # Assign ADMIN role
    admin_role = session.query(Usuario.__class__.metadata.tables['roles']).first()
    # Find ADMIN role
    from app.models.usuario import Rol
    admin_role = session.query(Rol).filter(Rol.nombre == "ADMIN").first()
    usuario_rol = UsuarioRol(usuario_id=user.id, rol_id=admin_role.id)
    session.add(usuario_rol)
    session.commit()
    session.refresh(user)
    
    token = create_access_token(data={"sub": str(user.id)})
    return token


@pytest.fixture(name="stock_token")
def stock_token_fixture(session: Session):
    """Create stock user and return JWT token"""
    user = Usuario(
        nombre="Stock User",
        email="stock@example.com",
        password_hash=hash_password("StockPassword123"),
    )
    session.add(user)
    session.commit()
    session.refresh(user)
    
    # Assign STOCK role
    from app.models.usuario import Rol
    stock_role = session.query(Rol).filter(Rol.nombre == "STOCK").first()
    usuario_rol = UsuarioRol(usuario_id=user.id, rol_id=stock_role.id)
    session.add(usuario_rol)
    session.commit()
    session.refresh(user)
    
    token = create_access_token(data={"sub": str(user.id)})
    return token


@pytest.fixture(name="client_token")
def client_token_fixture(test_user):
    """Get token for CLIENT user"""
    token = create_access_token(data={"sub": str(test_user.id)})
    return token


class TestCategoryEndpointsCreate:
    """Test suite for POST /api/v1/categorias"""
    
    def test_create_category_admin_success(self, client: TestClient, admin_token: str):
        """Test creating category with ADMIN role"""
        response = client.post(
            "/api/v1/categorias/",
            json={"nombre": "Fruits", "padre_id": None},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["nombre"] == "Fruits"
        assert data["padre_id"] is None
    
    def test_create_category_stock_success(self, client: TestClient, stock_token: str):
        """Test creating category with STOCK role"""
        response = client.post(
            "/api/v1/categorias/",
            json={"nombre": "Vegetables", "padre_id": None},
            headers={"Authorization": f"Bearer {stock_token}"}
        )
        
        assert response.status_code == 201
        data = response.json()
        assert data["nombre"] == "Vegetables"
    
    def test_create_category_client_forbidden(self, client: TestClient, client_token: str):
        """Test that CLIENT role cannot create categories"""
        response = client.post(
            "/api/v1/categorias/",
            json={"nombre": "Unauthorized", "padre_id": None},
            headers={"Authorization": f"Bearer {client_token}"}
        )
        
        assert response.status_code == 403
    
    def test_create_category_no_auth_forbidden(self, client: TestClient):
        """Test that unauthenticated request is rejected"""
        response = client.post(
            "/api/v1/categorias/",
            json={"nombre": "NoAuth", "padre_id": None}
        )
        
        assert response.status_code == 403
    
    def test_create_category_invalid_parent(self, client: TestClient, admin_token: str):
        """Test creating category with non-existent parent"""
        response = client.post(
            "/api/v1/categorias/",
            json={"nombre": "Citrus", "padre_id": 9999},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 404
    
    def test_create_category_duplicate_name(self, client: TestClient, admin_token: str):
        """Test creating category with duplicate name"""
        # Create first category
        client.post(
            "/api/v1/categorias/",
            json={"nombre": "Fruits", "padre_id": None},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        # Try to create duplicate
        response = client.post(
            "/api/v1/categorias/",
            json={"nombre": "Fruits", "padre_id": None},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 409


class TestCategoryEndpointsGetTree:
    """Test suite for GET /api/v1/categorias (public tree)"""
    
    def test_get_categories_tree_public(self, client: TestClient, session: Session):
        """Test getting category tree as public endpoint (no auth required)"""
        # Create categories
        cat1 = Categoria(nombre="Fruits", padre_id=None)
        session.add(cat1)
        session.commit()
        session.refresh(cat1)
        
        cat2 = Categoria(nombre="Citrus", padre_id=cat1.id)
        session.add(cat2)
        session.commit()
        
        # Get tree without authentication
        response = client.get("/api/v1/categorias/")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) > 0
        assert any(item["nombre"] == "Fruits" for item in data)
    
    def test_get_categories_tree_empty(self, client: TestClient):
        """Test getting empty category tree"""
        response = client.get("/api/v1/categorias/")
        
        assert response.status_code == 200
        assert response.json() == []
    
    def test_get_categories_tree_nested_structure(self, client: TestClient, session: Session):
        """Test that tree has proper nested structure"""
        # Create nested hierarchy
        fruits = Categoria(nombre="Fruits", padre_id=None)
        session.add(fruits)
        session.commit()
        session.refresh(fruits)
        
        citrus = Categoria(nombre="Citrus", padre_id=fruits.id)
        session.add(citrus)
        session.commit()
        session.refresh(citrus)
        
        orange = Categoria(nombre="Orange", padre_id=citrus.id)
        session.add(orange)
        session.commit()
        
        response = client.get("/api/v1/categorias/")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["nombre"] == "Fruits"
        assert "subcategorias" in data[0]
        assert len(data[0]["subcategorias"]) == 1


class TestCategoryEndpointsGetSingle:
    """Test suite for GET /api/v1/categorias/{id}"""
    
    def test_get_category_admin_success(self, client: TestClient, admin_token: str, session: Session):
        """Test admin can get single category"""
        category = Categoria(nombre="Fruits", padre_id=None)
        session.add(category)
        session.commit()
        session.refresh(category)
        
        response = client.get(
            f"/api/v1/categorias/{category.id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["nombre"] == "Fruits"
    
    def test_get_category_client_forbidden(self, client: TestClient, client_token: str, session: Session):
        """Test that CLIENT role cannot get category"""
        category = Categoria(nombre="Fruits", padre_id=None)
        session.add(category)
        session.commit()
        session.refresh(category)
        
        response = client.get(
            f"/api/v1/categorias/{category.id}",
            headers={"Authorization": f"Bearer {client_token}"}
        )
        
        assert response.status_code == 403
    
    def test_get_category_not_found(self, client: TestClient, admin_token: str):
        """Test getting non-existent category"""
        response = client.get(
            "/api/v1/categorias/9999",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 404


class TestCategoryEndpointsUpdate:
    """Test suite for PUT /api/v1/categorias/{id}"""
    
    def test_update_category_name(self, client: TestClient, admin_token: str, session: Session):
        """Test updating category name"""
        category = Categoria(nombre="OldName", padre_id=None)
        session.add(category)
        session.commit()
        session.refresh(category)
        
        response = client.put(
            f"/api/v1/categorias/{category.id}",
            json={"nombre": "NewName"},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["nombre"] == "NewName"
    
    def test_update_category_cycle_rejected(self, client: TestClient, admin_token: str, session: Session):
        """Test that cycle creation is rejected"""
        # Create A -> B
        cat_a = Categoria(nombre="A", padre_id=None)
        session.add(cat_a)
        session.commit()
        session.refresh(cat_a)
        
        cat_b = Categoria(nombre="B", padre_id=cat_a.id)
        session.add(cat_b)
        session.commit()
        session.refresh(cat_b)
        
        # Try to make B parent of A (cycle)
        response = client.put(
            f"/api/v1/categorias/{cat_a.id}",
            json={"padre_id": cat_b.id},
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 400
        assert "cycle" in response.json()["detail"].lower()


class TestCategoryEndpointsDelete:
    """Test suite for DELETE /api/v1/categorias/{id}"""
    
    def test_delete_empty_category_success(self, client: TestClient, admin_token: str, session: Session):
        """Test deleting empty category"""
        category = Categoria(nombre="Empty", padre_id=None)
        session.add(category)
        session.commit()
        session.refresh(category)
        
        response = client.delete(
            f"/api/v1/categorias/{category.id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 204
    
    def test_delete_category_with_products_fails(self, client: TestClient, admin_token: str, session: Session):
        """Test that deleting category with products fails"""
        category = Categoria(nombre="Fruits", padre_id=None)
        session.add(category)
        session.commit()
        session.refresh(category)
        
        # Add product
        product = Producto(nombre="Apple", precio=10.0, stock_cantidad=100, disponible=True)
        session.add(product)
        session.commit()
        session.refresh(product)
        
        pc = ProductoCategoria(producto_id=product.id, categoria_id=category.id)
        session.add(pc)
        session.commit()
        
        # Try to delete
        response = client.delete(
            f"/api/v1/categorias/{category.id}",
            headers={"Authorization": f"Bearer {admin_token}"}
        )
        
        assert response.status_code == 409
        assert "active products" in response.json()["detail"].lower()
    
    def test_delete_category_client_forbidden(self, client: TestClient, client_token: str, session: Session):
        """Test that CLIENT role cannot delete categories"""
        category = Categoria(nombre="Fruits", padre_id=None)
        session.add(category)
        session.commit()
        session.refresh(category)
        
        response = client.delete(
            f"/api/v1/categorias/{category.id}",
            headers={"Authorization": f"Bearer {client_token}"}
        )
        
        assert response.status_code == 403
