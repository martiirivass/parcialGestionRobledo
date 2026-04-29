"""
Base Repository - Generic CRUD operations
"""
from typing import TypeVar, Generic, Optional, List, Any
from sqlmodel import Session, SQLModel, select

T = TypeVar("T", bound=SQLModel)


class BaseRepository(Generic[T]):
    """Generic repository with common CRUD operations"""
    
    def __init__(self, model: type[T], session: Session):
        self.model = model
        self.session = session
    
    def get_by_id(self, id: int, include_deleted: bool = False) -> Optional[T]:
        """Get a record by ID"""
        query = select(self.model).where(self.model.id == id)
        if not include_deleted:
            # Exclude soft-deleted records if the model has eliminado_en
            if hasattr(self.model, 'eliminado_en'):
                query = query.where(self.model.eliminado_en == None)
        return self.session.exec(query).first()
    
    def list_all(
        self, 
        skip: int = 0, 
        limit: int = 100, 
        include_deleted: bool = False,
        **filters
    ) -> List[T]:
        """List records with pagination and filters"""
        query = select(self.model)
        
        if not include_deleted and hasattr(self.model, 'eliminado_en'):
            query = query.where(self.model.eliminado_en == None)
        
        # Apply filters
        for field_name, value in filters.items():
            if hasattr(self.model, field_name):
                field = getattr(self.model, field_name)
                query = query.where(field == value)
        
        query = query.offset(skip).limit(limit)
        return list(self.session.exec(query).all())
    
    def count(self, include_deleted: bool = False, **filters) -> int:
        """Count records matching filters"""
        query = select(self.model)
        
        if not include_deleted and hasattr(self.model, 'eliminado_en'):
            query = query.where(self.model.eliminado_en == None)
        
        # Apply filters
        for field_name, value in filters.items():
            if hasattr(self.model, field_name):
                field = getattr(self.model, field_name)
                query = query.where(field == value)
        
        return len(list(self.session.exec(query).all()))
    
    def create(self, obj: T) -> T:
        """Create a new record"""
        self.session.add(obj)
        self.session.flush()
        self.session.refresh(obj)
        return obj
    
    def update(self, id: int, data: dict) -> Optional[T]:
        """Update a record by ID"""
        obj = self.get_by_id(id)
        if obj:
            for key, value in data.items():
                setattr(obj, key, value)
            self.session.flush()
            self.session.refresh(obj)
        return obj
    
    def soft_delete(self, id: int) -> Optional[T]:
        """Soft delete a record"""
        from datetime import datetime
        obj = self.get_by_id(id, include_deleted=True)
        if obj and hasattr(obj, 'eliminado_en'):
            obj.eliminado_en = datetime.utcnow()
            self.session.flush()
            self.session.refresh(obj)
        return obj
    
    def hard_delete(self, id: int) -> bool:
        """Hard delete a record"""
        obj = self.get_by_id(id, include_deleted=True)
        if obj:
            self.session.delete(obj)
            self.session.flush()
            return True
        return False