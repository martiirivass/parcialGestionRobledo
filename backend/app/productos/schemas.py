"""
Product Schemas - Pydantic models for request/response validation
"""
from datetime import datetime
from decimal import Decimal
from typing import Optional, List
from pydantic import BaseModel, Field


class CategoriaInfo(BaseModel):
    """Category info for product response"""
    id: int = Field(..., description="Category ID")
    nombre: str = Field(..., description="Category name")
    
    class Config:
        from_attributes = True


class IngredienteInfo(BaseModel):
    """Ingredient info for product response"""
    id: int = Field(..., description="Ingredient ID")
    nombre: str = Field(..., description="Ingredient name")
    es_alergeno: bool = Field(..., description="Is allergen flag")
    
    class Config:
        from_attributes = True


class ProductBase(BaseModel):
    """Base product schema with common fields"""
    nombre: str = Field(..., min_length=3, max_length=255, description="Product name")
    descripcion: Optional[str] = Field(None, description="Product description")
    precio: Decimal = Field(..., gt=0, description="Product price (> 0)")
    stock: int = Field(default=0, ge=0, description="Product stock (>= 0)")
    imagen_url: Optional[str] = Field(None, max_length=500, description="Product image URL")
    disponible: bool = Field(default=True, description="Product availability flag")


class ProductCreate(ProductBase):
    """Schema for creating a new product"""
    categorias_ids: Optional[List[int]] = Field(None, description="Category IDs to associate")
    ingredientes_ids: Optional[List[int]] = Field(None, description="Ingredient IDs to associate")


class ProductUpdate(BaseModel):
    """Schema for updating a product"""
    nombre: Optional[str] = Field(None, min_length=3, max_length=255, description="New name")
    descripcion: Optional[str] = Field(None, description="New description")
    precio: Optional[Decimal] = Field(None, gt=0, description="New price")
    stock: Optional[int] = Field(None, ge=0, description="New stock")
    imagen_url: Optional[str] = Field(None, max_length=500, description="New image URL")
    disponible: Optional[bool] = Field(None, description="New availability flag")
    categorias_ids: Optional[List[int]] = Field(None, description="New category IDs")
    ingredientes_ids: Optional[List[int]] = Field(None, description="New ingredient IDs")


class ProductResponse(ProductBase):
    """Schema for product response"""
    id: int = Field(..., description="Product ID")
    creado_en: datetime = Field(..., description="Creation timestamp")
    actualizado_en: datetime = Field(..., description="Last update timestamp")
    eliminado_en: Optional[datetime] = Field(None, description="Soft delete timestamp")
    
    class Config:
        from_attributes = True


class ProductDetailResponse(ProductResponse):
    """Schema for detailed product response with relationships"""
    categorias: List[CategoriaInfo] = Field(default_factory=list, description="Associated categories")
    ingredientes: List[IngredienteInfo] = Field(default_factory=list, description="Associated ingredients")
    
    class Config:
        from_attributes = True


class ProductPublicResponse(BaseModel):
    """Schema for public product response (limited fields)"""
    id: int = Field(..., description="Product ID")
    nombre: str = Field(..., description="Product name")
    descripcion: Optional[str] = Field(None, description="Product description")
    precio: Decimal = Field(..., description="Product price")
    imagen_url: Optional[str] = Field(None, description="Product image URL")
    disponible: bool = Field(..., description="Product availability")
    categorias: List[CategoriaInfo] = Field(default_factory=list, description="Associated categories")
    ingredientes: List[IngredienteInfo] = Field(default_factory=list, description="Associated ingredients")
    
    class Config:
        from_attributes = True


class ProductListResponse(BaseModel):
    """Schema for product list with pagination"""
    items: List[ProductPublicResponse] = Field(..., description="List of products")
    total: int = Field(..., description="Total count of products")
    skip: int = Field(..., description="Pagination offset")
    limit: int = Field(..., description="Pagination limit")


class StockUpdateRequest(BaseModel):
    """Schema for stock update request"""
    cantidad: int = Field(..., description="Quantity to change (positive/negative)")


class ErrorResponse(BaseModel):
    """Schema for error responses"""
    type: str = Field(..., description="Error type")
    title: str = Field(..., description="Error title")
    status: int = Field(..., description="HTTP status code")
    detail: str = Field(..., description="Error detail message")
