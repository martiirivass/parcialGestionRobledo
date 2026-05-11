"""
Unit tests for ProductService and ProductRepository - Business logic validation
"""
import pytest
from decimal import Decimal
from datetime import datetime
from sqlmodel import Session, create_engine, SQLModel
from sqlalchemy.pool import StaticPool

from app.models.catalogo import Categoria, Producto, Ingrediente, ProductoCategoria, ProductoIngrediente
from app.models.usuario import Rol
from app.productos.service import ProductService
from app.repositories.product_repository import ProductRepository


@pytest.fixture(name="test_session")
def test_session_fixture():
    """Create test database session with in-memory SQLite"""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    
    with Session(engine) as session:
        # Create sample roles
        roles_data = [
            {"id": 1, "nombre": "ADMIN"},
            {"id": 2, "nombre": "STOCK"},
            {"id": 3, "nombre": "CLIENT"},
        ]
        for rol_data in roles_data:
            session.add(Rol(**rol_data))
        
        # Create sample categories
        cat1 = Categoria(id=1, nombre="Verduras")
        cat2 = Categoria(id=2, nombre="Frutas")
        session.add(cat1)
        session.add(cat2)
        
        # Create sample ingredients
        ing1 = Ingrediente(id=1, nombre="Tomate", es_alergeno=False)
        ing2 = Ingrediente(id=2, nombre="Cacahuete", es_alergeno=True)
        session.add(ing1)
        session.add(ing2)
        
        session.commit()
        
        yield session


class TestProductServiceCreate:
    """Test suite for ProductService.create_product()"""
    
    def test_create_basic_product(self, test_session: Session):
        """Test creating a basic product"""
        service = ProductService(test_session)
        
        product = service.create_product(
            nombre="Tomate Fresco",
            descripcion="Tomate de alta calidad",
            precio=Decimal("25.50"),
            stock=100,
            imagen_url="https://example.com/tomate.jpg",
            disponible=True,
            categorias_ids=[1],
            ingredientes_ids=[1]
        )
        
        assert product.id is not None
        assert product.nombre == "Tomate Fresco"
        assert product.precio == Decimal("25.50")
        assert product.stock == 100
        assert product.disponible is True
    
    def test_create_product_without_associations(self, test_session: Session):
        """Test creating a product without category/ingredient associations"""
        service = ProductService(test_session)
        
        product = service.create_product(
            nombre="Zanahoria",
            descripcion=None,
            precio=Decimal("15.00"),
            stock=50,
            imagen_url=None,
            disponible=True
        )
        
        assert product.id is not None
        assert product.nombre == "Zanahoria"
        assert len(product.categorias) == 0
        assert len(product.ingredientes) == 0
    
    def test_create_product_with_multiple_categories(self, test_session: Session):
        """Test creating a product with multiple categories"""
        service = ProductService(test_session)
        
        product = service.create_product(
            nombre="Mix de Verduras",
            descripcion="Mezcla de verduras frescas",
            precio=Decimal("30.00"),
            stock=75,
            imagen_url=None,
            disponible=True,
            categorias_ids=[1, 2]
        )
        
        assert len(product.categorias) == 2
    
    def test_create_product_invalid_price_zero(self, test_session: Session):
        """Test that creating product with price=0 fails"""
        service = ProductService(test_session)
        
        with pytest.raises(ValueError, match="greater than 0"):
            service.create_product(
                nombre="Producto Gratis",
                descripcion=None,
                precio=Decimal("0"),
                stock=10,
                imagen_url=None,
                disponible=True
            )
    
    def test_create_product_invalid_price_negative(self, test_session: Session):
        """Test that creating product with negative price fails"""
        service = ProductService(test_session)
        
        with pytest.raises(ValueError, match="greater than 0"):
            service.create_product(
                nombre="Producto Negativo",
                descripcion=None,
                precio=Decimal("-10"),
                stock=10,
                imagen_url=None,
                disponible=True
            )
    
    def test_create_product_invalid_stock_negative(self, test_session: Session):
        """Test that creating product with negative stock fails"""
        service = ProductService(test_session)
        
        with pytest.raises(ValueError, match="greater than or equal to 0"):
            service.create_product(
                nombre="Stock Negativo",
                descripcion=None,
                precio=Decimal("20"),
                stock=-5,
                imagen_url=None,
                disponible=True
            )
    
    def test_create_product_name_too_short(self, test_session: Session):
        """Test that creating product with name < 3 chars fails"""
        service = ProductService(test_session)
        
        with pytest.raises(ValueError, match="between 3 and 255"):
            service.create_product(
                nombre="AB",
                descripcion=None,
                precio=Decimal("20"),
                stock=10,
                imagen_url=None,
                disponible=True
            )
    
    def test_create_product_name_too_long(self, test_session: Session):
        """Test that creating product with name > 255 chars fails"""
        service = ProductService(test_session)
        
        long_name = "A" * 256
        with pytest.raises(ValueError, match="between 3 and 255"):
            service.create_product(
                nombre=long_name,
                descripcion=None,
                precio=Decimal("20"),
                stock=10,
                imagen_url=None,
                disponible=True
            )
    
    def test_create_product_nonexistent_category(self, test_session: Session):
        """Test that creating product with nonexistent category fails"""
        service = ProductService(test_session)
        
        with pytest.raises(ValueError, match="Categoria with id 999 not found"):
            service.create_product(
                nombre="Producto",
                descripcion=None,
                precio=Decimal("20"),
                stock=10,
                imagen_url=None,
                disponible=True,
                categorias_ids=[999]
            )
    
    def test_create_product_nonexistent_ingredient(self, test_session: Session):
        """Test that creating product with nonexistent ingredient fails"""
        service = ProductService(test_session)
        
        with pytest.raises(ValueError, match="Ingrediente with id 999 not found"):
            service.create_product(
                nombre="Producto",
                descripcion=None,
                precio=Decimal("20"),
                stock=10,
                imagen_url=None,
                disponible=True,
                ingredientes_ids=[999]
            )


class TestProductServiceList:
    """Test suite for ProductService.list_products_public()"""
    
    @pytest.fixture(autouse=True)
    def setup_products(self, test_session: Session):
        """Setup test products"""
        # Create products
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
        p3 = Producto(
            id=3,
            nombre="Manzana",
            precio=Decimal("30.00"),
            stock=0,  # Out of stock
            disponible=True,
            eliminado_en=None
        )
        test_session.add(p1)
        test_session.add(p2)
        test_session.add(p3)
        test_session.commit()
    
    def test_list_products_public(self, test_session: Session):
        """Test listing public products"""
        service = ProductService(test_session)
        
        productos, total = service.list_products_public(skip=0, limit=100)
        
        # Only products with stock > 0 should be returned
        assert total == 2
        assert len(productos) == 2
        product_names = {p.nombre for p in productos}
        assert "Tomate" in product_names
        assert "Zanahoria" in product_names
        assert "Manzana" not in product_names  # Out of stock
    
    def test_list_products_with_pagination(self, test_session: Session):
        """Test listing products with pagination"""
        service = ProductService(test_session)
        
        page1, total1 = service.list_products_public(skip=0, limit=1)
        page2, total2 = service.list_products_public(skip=1, limit=1)
        
        assert total1 == 2
        assert len(page1) == 1
        assert len(page2) == 1
        assert page1[0].nombre != page2[0].nombre
    
    def test_list_products_with_search(self, test_session: Session):
        """Test listing products with search filter"""
        service = ProductService(test_session)
        
        productos, total = service.list_products_public(search="Tomate")
        
        assert total == 1
        assert productos[0].nombre == "Tomate"


class TestProductServiceGet:
    """Test suite for ProductService.get_product()"""
    
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
            nombre="Plátano Eliminado",
            precio=Decimal("20.00"),
            stock=50,
            disponible=True,
            eliminado_en=datetime.utcnow()  # Soft deleted
        )
        test_session.add(p1)
        test_session.add(p2)
        test_session.commit()
    
    def test_get_product_public(self, test_session: Session):
        """Test getting product via public view"""
        service = ProductService(test_session)
        
        product = service.get_product(id=1, admin=False)
        
        assert product.id == 1
        assert product.nombre == "Tomate"
    
    def test_get_product_public_soft_deleted(self, test_session: Session):
        """Test that soft-deleted products are not visible in public view"""
        service = ProductService(test_session)
        
        with pytest.raises(ValueError, match="not found"):
            service.get_product(id=2, admin=False)
    
    def test_get_product_admin(self, test_session: Session):
        """Test getting product via admin view"""
        service = ProductService(test_session)
        
        product = service.get_product(id=2, admin=True, include_deleted=True)
        
        assert product.id == 2
        assert product.eliminado_en is not None
    
    def test_get_product_not_found(self, test_session: Session):
        """Test getting nonexistent product"""
        service = ProductService(test_session)
        
        with pytest.raises(ValueError, match="not found"):
            service.get_product(id=999)


class TestProductServiceUpdate:
    """Test suite for ProductService.update_product()"""
    
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
    
    def test_update_product_name(self, test_session: Session):
        """Test updating product name"""
        service = ProductService(test_session)
        
        updated = service.update_product(id=1, nombre="Tomate Rojo")
        
        assert updated.nombre == "Tomate Rojo"
        assert updated.precio == Decimal("25.50")
    
    def test_update_product_price(self, test_session: Session):
        """Test updating product price"""
        service = ProductService(test_session)
        
        updated = service.update_product(id=1, precio=Decimal("30.00"))
        
        assert updated.precio == Decimal("30.00")
    
    def test_update_product_invalid_price(self, test_session: Session):
        """Test that invalid price update fails"""
        service = ProductService(test_session)
        
        with pytest.raises(ValueError, match="greater than 0"):
            service.update_product(id=1, precio=Decimal("0"))
    
    def test_update_product_not_found(self, test_session: Session):
        """Test updating nonexistent product"""
        service = ProductService(test_session)
        
        with pytest.raises(ValueError, match="not found"):
            service.update_product(id=999, nombre="Producto")


class TestProductServiceDelete:
    """Test suite for ProductService.delete_product()"""
    
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
    
    def test_delete_product(self, test_session: Session):
        """Test soft deleting a product"""
        service = ProductService(test_session)
        
        deleted = service.delete_product(id=1)
        
        assert deleted.eliminado_en is not None
        
        # Verify it's not visible in public list
        productos, _ = service.list_products_public()
        assert len(productos) == 0


class TestProductServiceStock:
    """Test suite for ProductService.update_stock()"""
    
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
    
    def test_increase_stock(self, test_session: Session):
        """Test increasing product stock"""
        service = ProductService(test_session)
        
        updated = service.update_stock(id=1, cantidad=50)
        
        assert updated.stock == 150
    
    def test_decrease_stock(self, test_session: Session):
        """Test decreasing product stock"""
        service = ProductService(test_session)
        
        updated = service.update_stock(id=1, cantidad=-30)
        
        assert updated.stock == 70
    
    def test_decrease_stock_to_zero(self, test_session: Session):
        """Test decreasing stock to zero"""
        service = ProductService(test_session)
        
        updated = service.update_stock(id=1, cantidad=-100)
        
        assert updated.stock == 0
    
    def test_decrease_stock_below_zero(self, test_session: Session):
        """Test that stock cannot go negative"""
        service = ProductService(test_session)
        
        with pytest.raises(ValueError, match="cannot be negative"):
            service.update_stock(id=1, cantidad=-150)
