"""
Category Schemas - Pydantic models for request/response validation
"""
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field


class CategoryBase(BaseModel):
    """Base category schema with common fields"""
    nombre: str = Field(..., min_length=1, max_length=100, description="Category name")
    padre_id: Optional[int] = Field(None, description="Parent category ID (null for root)")


class CategoryCreate(CategoryBase):
    """Schema for creating a new category"""
    pass


class CategoryUpdate(BaseModel):
    """Schema for updating a category"""
    nombre: Optional[str] = Field(None, min_length=1, max_length=100, description="New name")
    padre_id: Optional[int] = Field(None, description="New parent category ID")


class CategoryResponse(CategoryBase):
    """Schema for category response"""
    id: int = Field(..., description="Category ID")
    creado_en: datetime = Field(..., description="Creation timestamp")
    actualizado_en: datetime = Field(..., description="Last update timestamp")
    eliminado_en: Optional[datetime] = Field(None, description="Soft delete timestamp")
    
    class Config:
        from_attributes = True


class CategoryTreeNode(BaseModel):
    """Schema for nested tree node"""
    id: int = Field(..., description="Category ID")
    nombre: str = Field(..., description="Category name")
    padre_id: Optional[int] = Field(None, description="Parent category ID")
    subcategorias: List["CategoryTreeNode"] = Field(
        default_factory=list,
        description="Child categories (recursive)"
    )
    
    class Config:
        from_attributes = True


# Update forward reference
CategoryTreeNode.model_rebuild()


class ErrorResponse(BaseModel):
    """Schema for error responses"""
    type: str = Field(..., description="Error type")
    title: str = Field(..., description="Error title")
    status: int = Field(..., description="HTTP status code")
    detail: str = Field(..., description="Error detail message")
