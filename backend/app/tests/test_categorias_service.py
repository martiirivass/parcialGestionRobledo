"""
Unit tests for CategoryService - Business logic validation
"""
import pytest
from datetime import datetime
from sqlmodel import Session, create_engine, SQLModel
from sqlalchemy.pool import StaticPool

from app.models.usuario import Usuario, Rol, UsuarioRol
from app.models.catalogo import Categoria, Producto, ProductoCategoria
from app.categorias.service import CategoryService
from app.core.security import hash_password


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
        session.commit()
        
        yield session


class TestCategoryServiceCreate:
    """Test suite for CategoryService.create_category()"""
    
    def test_create_root_category(self, test_session: Session):
        """Test creating a root category (no parent)"""
        service = CategoryService(test_session)
        
        category = service.create_category(nombre="Fruits", parent_id=None)
        
        assert category.id is not None
        assert category.nombre == "Fruits"
        assert category.padre_id is None
        assert category.creado_en is not None
        assert category.actualizado_en is not None
        assert category.eliminado_en is None
    
    def test_create_subcategory(self, test_session: Session):
        """Test creating a subcategory under a parent"""
        service = CategoryService(test_session)
        
        # Create parent
        parent = service.create_category(nombre="Fruits", parent_id=None)
        test_session.commit()
        
        # Create child
        child = service.create_category(nombre="Citrus", parent_id=parent.id)
        
        assert child.padre_id == parent.id
        assert child.nombre == "Citrus"
    
    def test_create_duplicate_name_same_parent_fails(self, test_session: Session):
        """Test that duplicate names under same parent are rejected"""
        service = CategoryService(test_session)
        
        # Create first category
        service.create_category(nombre="Fruits", parent_id=None)
        test_session.commit()
        
        # Try to create duplicate
        with pytest.raises(ValueError, match="already exists"):
            service.create_category(nombre="Fruits", parent_id=None)
    
    def test_create_duplicate_name_different_parent_succeeds(self, test_session: Session):
        """Test that same names under different parents are allowed"""
        service = CategoryService(test_session)
        
        # Create two parent categories
        parent1 = service.create_category(nombre="Vegetables", parent_id=None)
        parent2 = service.create_category(nombre="Fruits", parent_id=None)
        test_session.commit()
        
        # Create same child name under different parents - should succeed
        child1 = service.create_category(nombre="Fresh", parent_id=parent1.id)
        child2 = service.create_category(nombre="Fresh", parent_id=parent2.id)
        
        assert child1.id != child2.id
        assert child1.nombre == child2.nombre
    
    def test_create_with_nonexistent_parent_fails(self, test_session: Session):
        """Test that creating with non-existent parent fails"""
        service = CategoryService(test_session)
        
        with pytest.raises(ValueError, match="not found"):
            service.create_category(nombre="Citrus", parent_id=9999)


class TestCategoryServiceCyclePrevention:
    """Test suite for cycle detection in category hierarchy"""
    
    def test_validate_no_cycles_self_reference_fails(self, test_session: Session):
        """Test that self-reference is rejected"""
        service = CategoryService(test_session)
        
        category = service.create_category(nombre="Fruits", parent_id=None)
        test_session.commit()
        
        # Try to set itself as parent
        with pytest.raises(ValueError, match="cycle"):
            service.update_category(
                category_id=category.id,
                parent_id=category.id
            )
    
    def test_validate_no_cycles_two_level_cycle_fails(self, test_session: Session):
        """Test that two-level cycles are rejected (A -> B -> A)"""
        service = CategoryService(test_session)
        
        # Create A -> B hierarchy
        cat_a = service.create_category(nombre="A", parent_id=None)
        test_session.commit()
        
        cat_b = service.create_category(nombre="B", parent_id=cat_a.id)
        test_session.commit()
        
        # Try to make B the parent of A (creates cycle)
        with pytest.raises(ValueError, match="cycle"):
            service.update_category(
                category_id=cat_a.id,
                parent_id=cat_b.id
            )
    
    def test_validate_no_cycles_three_level_cycle_fails(self, test_session: Session):
        """Test that three-level cycles are rejected (A -> B -> C -> A)"""
        service = CategoryService(test_session)
        
        # Create A -> B -> C hierarchy
        cat_a = service.create_category(nombre="A", parent_id=None)
        test_session.commit()
        
        cat_b = service.create_category(nombre="B", parent_id=cat_a.id)
        test_session.commit()
        
        cat_c = service.create_category(nombre="C", parent_id=cat_b.id)
        test_session.commit()
        
        # Try to make C the parent of A (creates cycle)
        with pytest.raises(ValueError, match="cycle"):
            service.update_category(
                category_id=cat_a.id,
                parent_id=cat_c.id
            )
    
    def test_valid_reparenting_no_cycle(self, test_session: Session):
        """Test that valid reparenting without cycles succeeds"""
        service = CategoryService(test_session)
        
        # Create hierarchy: A, B, C as siblings
        cat_a = service.create_category(nombre="A", parent_id=None)
        test_session.commit()
        
        cat_b = service.create_category(nombre="B", parent_id=None)
        test_session.commit()
        
        cat_c = service.create_category(nombre="C", parent_id=cat_a.id)
        test_session.commit()
        
        # Move C from A's parent to B's parent - should succeed
        updated_c = service.update_category(
            category_id=cat_c.id,
            parent_id=cat_b.id
        )
        
        assert updated_c.padre_id == cat_b.id


class TestCategoryServiceSoftDelete:
    """Test suite for soft delete with product integrity checks"""
    
    def test_delete_empty_category_succeeds(self, test_session: Session):
        """Test that deleting empty category succeeds"""
        service = CategoryService(test_session)
        
        category = service.create_category(nombre="Empty", parent_id=None)
        test_session.commit()
        
        deleted = service.delete_category(category.id)
        
        assert deleted.eliminado_en is not None
    
    def test_delete_category_with_products_fails(self, test_session: Session):
        """Test that deleting category with products fails"""
        service = CategoryService(test_session)
        
        # Create category
        category = service.create_category(nombre="Fruits", parent_id=None)
        test_session.commit()
        
        # Create product in category
        product = Producto(
            nombre="Apple",
            precio=10.0,
            stock_cantidad=100,
            disponible=True
        )
        test_session.add(product)
        test_session.commit()
        
        # Link product to category
        pc = ProductoCategoria(producto_id=product.id, categoria_id=category.id)
        test_session.add(pc)
        test_session.commit()
        
        # Try to delete - should fail
        with pytest.raises(ValueError, match="active products"):
            service.delete_category(category.id)
    
    def test_delete_category_with_products_in_descendants_fails(self, test_session: Session):
        """Test that deleting category fails if descendants have products"""
        service = CategoryService(test_session)
        
        # Create hierarchy
        parent = service.create_category(nombre="Fruits", parent_id=None)
        test_session.commit()
        
        child = service.create_category(nombre="Citrus", parent_id=parent.id)
        test_session.commit()
        
        # Create product in child category
        product = Producto(
            nombre="Orange",
            precio=5.0,
            stock_cantidad=50,
            disponible=True
        )
        test_session.add(product)
        test_session.commit()
        
        pc = ProductoCategoria(producto_id=product.id, categoria_id=child.id)
        test_session.add(pc)
        test_session.commit()
        
        # Try to delete parent - should fail
        with pytest.raises(ValueError, match="active products"):
            service.delete_category(parent.id)


class TestCategoryServiceRetrieval:
    """Test suite for category retrieval and tree building"""
    
    def test_get_category_by_id(self, test_session: Session):
        """Test retrieving a category by ID"""
        service = CategoryService(test_session)
        
        category = service.create_category(nombre="Fruits", parent_id=None)
        test_session.commit()
        
        retrieved = service.get_category_by_id(category.id)
        
        assert retrieved is not None
        assert retrieved.id == category.id
        assert retrieved.nombre == "Fruits"
    
    def test_get_category_not_found(self, test_session: Session):
        """Test that getting non-existent category returns None"""
        service = CategoryService(test_session)
        
        result = service.get_category_by_id(9999)
        
        assert result is None
    
    def test_get_category_tree_empty(self, test_session: Session):
        """Test getting tree when no categories exist"""
        service = CategoryService(test_session)
        
        tree = service.get_category_tree()
        
        assert tree == []
    
    def test_get_category_tree_flat(self, test_session: Session):
        """Test getting tree with only root categories"""
        service = CategoryService(test_session)
        
        cat1 = service.create_category(nombre="Fruits", parent_id=None)
        cat2 = service.create_category(nombre="Vegetables", parent_id=None)
        test_session.commit()
        
        tree = service.get_category_tree()
        
        assert len(tree) == 2
        assert all(item["padre_id"] is None for item in tree)
    
    def test_get_category_tree_nested(self, test_session: Session):
        """Test getting tree with nested hierarchy"""
        service = CategoryService(test_session)
        
        # Create hierarchy
        fruits = service.create_category(nombre="Fruits", parent_id=None)
        test_session.commit()
        
        citrus = service.create_category(nombre="Citrus", parent_id=fruits.id)
        berries = service.create_category(nombre="Berries", parent_id=fruits.id)
        test_session.commit()
        
        orange = service.create_category(nombre="Orange", parent_id=citrus.id)
        test_session.commit()
        
        tree = service.get_category_tree()
        
        # Verify structure
        assert len(tree) == 1
        assert tree[0]["nombre"] == "Fruits"
        assert len(tree[0]["subcategorias"]) == 2
        
        # Find citrus subcategory
        citrus_item = next(
            (s for s in tree[0]["subcategorias"] if s["nombre"] == "Citrus"),
            None
        )
        assert citrus_item is not None
        assert len(citrus_item["subcategorias"]) == 1
        assert citrus_item["subcategorias"][0]["nombre"] == "Orange"
