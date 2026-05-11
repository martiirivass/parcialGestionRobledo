"""
Productos Router - Product management endpoints
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel import Session

from app.core.database import get_session_context
from app.core.dependencies import get_current_user
from app.models.usuario import Usuario
from app.productos.schemas import (
    ProductCreate,
    ProductUpdate,
    ProductResponse,
    ProductDetailResponse,
    ProductPublicResponse,
    ProductListResponse,
    StockUpdateRequest,
    ErrorResponse,
)
from app.productos.service import ProductService


# Helper function to check roles
def require_admin_or_stock(current_user: Usuario) -> None:
    """Check if user has ADMIN or STOCK role"""
    user_roles = [rol.rol.nombre for rol in current_user.roles]
    if not any(role in user_roles for role in ["ADMIN", "STOCK"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User does not have required roles: ADMIN, STOCK",
        )


router = APIRouter()


@router.post(
    "/",
    response_model=ProductResponse,
    status_code=201,
    responses={
        400: {"model": ErrorResponse, "description": "Validation error"},
        403: {"model": ErrorResponse, "description": "Insufficient permissions"},
        404: {"model": ErrorResponse, "description": "Category or ingredient not found"},
    },
)
async def create_product(
    product_data: ProductCreate,
    current_user: Usuario = Depends(get_current_user),
    session: Session = Depends(get_session_context),
):
    """
    Create a new product (admin/stock only).
    
    Creates a new product with optional associations to categories and ingredients.
    
    **Authorization**: Requires ADMIN or STOCK role
    
    **Validations**:
    - Product name must be 3-255 characters
    - Price must be > 0
    - Stock must be >= 0
    - All categoria_ids must exist and not be deleted
    - All ingrediente_ids must exist
    
    **Request Body**:
    - `nombre`: Product name (required, 3-255 chars)
    - `precio`: Product price in pesos (required, > 0)
    - `stock`: Initial quantity (required, >= 0)
    - `descripcion`: Product description (optional)
    - `imagen_url`: Product image URL (optional)
    - `disponible`: Availability flag (default: true)
    - `categorias_ids`: List of category IDs to associate (optional)
    - `ingredientes_ids`: List of ingredient IDs to associate (optional)
    """
    # Check authorization
    require_admin_or_stock(current_user)
    
    try:
        service = ProductService(session)
        new_product = service.create_product(
            nombre=product_data.nombre,
            descripcion=product_data.descripcion,
            precio=product_data.precio,
            stock=product_data.stock,
            imagen_url=product_data.imagen_url,
            disponible=product_data.disponible,
            categorias_ids=product_data.categorias_ids,
            ingredientes_ids=product_data.ingredientes_ids,
        )
        session.commit()
        return new_product
    except ValueError as e:
        session.rollback()
        error_msg = str(e)
        
        if "not found" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=error_msg,
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_msg,
            )
    except Exception as e:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while creating the product",
        )


@router.get(
    "/",
    response_model=ProductListResponse,
    status_code=200,
    responses={
        200: {"description": "Product list retrieved successfully"},
    },
)
async def list_products(
    skip: int = Query(0, ge=0, description="Pagination offset"),
    limit: int = Query(100, ge=1, le=500, description="Pagination limit"),
    categoria_id: int = Query(None, description="Filter by category ID"),
    search: str = Query(None, description="Search in product name"),
    excluir_alergenos: str = Query(None, description="Comma-separated allergen ingredient IDs to exclude"),
    session: Session = Depends(get_session_context),
):
    """
    List public products with pagination and filtering.
    
    Returns only available products (disponible=true, stock>0, not soft-deleted).
    
    **Authorization**: No authentication required
    
    **Query Parameters**:
    - `skip`: Pagination offset (default: 0)
    - `limit`: Pagination limit (default: 100, max: 500)
    - `categoria_id`: Optional category ID to filter by
    - `search`: Optional text to search in product name
    - `excluir_alergenos`: Optional comma-separated allergen ingredient IDs to exclude
    
    **Response**:
    Returns paginated list of products with basic information (no exact stock quantity).
    """
    try:
        service = ProductService(session)
        
        # Parse allergen IDs if provided
        allergen_ids = None
        if excluir_alergenos:
            allergen_ids = [int(x.strip()) for x in excluir_alergenos.split(",")]
        
        productos, total = service.list_products_public(
            skip=skip,
            limit=limit,
            categoria_id=categoria_id,
            search=search,
            excluir_alergenos=allergen_ids,
        )
        
        # Convert to response models
        items = [ProductPublicResponse.from_orm(p) for p in productos]
        
        return ProductListResponse(
            items=items,
            total=total,
            skip=skip,
            limit=limit,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while retrieving products",
        )


@router.get(
    "/{product_id}",
    response_model=ProductDetailResponse,
    status_code=200,
    responses={
        404: {"model": ErrorResponse, "description": "Product not found"},
    },
)
async def get_product(
    product_id: int,
    admin: bool = Query(False, description="Admin view (requires auth)"),
    include_deleted: bool = Query(False, description="Include soft-deleted products (admin only)"),
    current_user: Usuario = Depends(get_current_user) if admin else None,
    session: Session = Depends(get_session_context),
):
    """
    Get a single product by ID.
    
    Returns detailed information about a product including associated categories and ingredients.
    
    **Authorization**: 
    - Public view (admin=false): No authentication required
    - Admin view (admin=true): Requires ADMIN or STOCK role
    
    **Query Parameters**:
    - `admin`: Use admin view (default: false)
    - `include_deleted`: Include soft-deleted products (admin view only, default: false)
    
    **Response**:
    Returns full product details with nested categories and ingredients arrays.
    """
    try:
        # Check authorization if admin view requested
        if admin:
            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Authentication required for admin view",
                )
            user_roles = [rol.rol.nombre for rol in current_user.roles]
            if not any(role in user_roles for role in ["ADMIN", "STOCK"]):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="User does not have required roles: ADMIN, STOCK",
                )
        
        service = ProductService(session)
        producto = service.get_product(
            id=product_id,
            admin=admin,
            include_deleted=include_deleted,
        )
        
        return ProductDetailResponse.from_orm(producto)
    except ValueError as e:
        error_msg = str(e)
        if "not found" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=error_msg,
            )
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_msg,
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while retrieving the product",
        )


@router.put(
    "/{product_id}",
    response_model=ProductResponse,
    status_code=200,
    responses={
        400: {"model": ErrorResponse, "description": "Validation error"},
        403: {"model": ErrorResponse, "description": "Insufficient permissions"},
        404: {"model": ErrorResponse, "description": "Product, category, or ingredient not found"},
    },
)
async def update_product(
    product_id: int,
    product_data: ProductUpdate,
    current_user: Usuario = Depends(get_current_user),
    session: Session = Depends(get_session_context),
):
    """
    Update a product (admin/stock only).
    
    Updates one or more product fields. Only provided fields are updated.
    
    **Authorization**: Requires ADMIN or STOCK role
    
    **Validations**:
    - If provided, name must be 3-255 characters
    - If provided, price must be > 0
    - If provided, stock must be >= 0
    - All categoria_ids must exist (if provided)
    - All ingrediente_ids must exist (if provided)
    
    **Request Body**:
    All fields are optional. Only provided fields are updated.
    """
    # Check authorization
    require_admin_or_stock(current_user)
    
    try:
        service = ProductService(session)
        updated_product = service.update_product(
            id=product_id,
            nombre=product_data.nombre,
            descripcion=product_data.descripcion,
            precio=product_data.precio,
            stock=product_data.stock,
            imagen_url=product_data.imagen_url,
            disponible=product_data.disponible,
            categorias_ids=product_data.categorias_ids,
            ingredientes_ids=product_data.ingredientes_ids,
        )
        session.commit()
        return updated_product
    except ValueError as e:
        session.rollback()
        error_msg = str(e)
        
        if "not found" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=error_msg,
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_msg,
            )
    except Exception as e:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while updating the product",
        )


@router.delete(
    "/{product_id}",
    status_code=204,
    responses={
        403: {"model": ErrorResponse, "description": "Insufficient permissions"},
        404: {"model": ErrorResponse, "description": "Product not found"},
    },
)
async def delete_product(
    product_id: int,
    current_user: Usuario = Depends(get_current_user),
    session: Session = Depends(get_session_context),
):
    """
    Soft delete a product (admin/stock only).
    
    Marks a product as deleted without removing it from the database.
    Preserves audit trail and historical data for orders.
    
    **Authorization**: Requires ADMIN or STOCK role
    
    **Returns**: 204 No Content on success
    """
    # Check authorization
    require_admin_or_stock(current_user)
    
    try:
        service = ProductService(session)
        service.delete_product(product_id)
        session.commit()
        return None
    except ValueError as e:
        session.rollback()
        error_msg = str(e)
        
        if "not found" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=error_msg,
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_msg,
            )
    except Exception as e:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while deleting the product",
        )


@router.patch(
    "/{product_id}/stock",
    response_model=ProductResponse,
    status_code=200,
    responses={
        400: {"model": ErrorResponse, "description": "Invalid stock update"},
        403: {"model": ErrorResponse, "description": "Insufficient permissions"},
        404: {"model": ErrorResponse, "description": "Product not found"},
    },
)
async def update_stock(
    product_id: int,
    stock_update: StockUpdateRequest,
    current_user: Usuario = Depends(get_current_user),
    session: Session = Depends(get_session_context),
):
    """
    Update product stock atomically (admin/stock only).
    
    Updates product inventory with atomic transaction to prevent race conditions.
    Quantity can be positive (increase) or negative (decrease).
    
    **Authorization**: Requires ADMIN or STOCK role
    
    **Request Body**:
    - `cantidad`: Quantity to change (positive/negative integer)
    
    **Validations**:
    - Resulting stock must be >= 0
    
    **Returns**: Updated product with new stock quantity
    """
    # Check authorization
    require_admin_or_stock(current_user)
    
    try:
        service = ProductService(session)
        updated_product = service.update_stock(
            id=product_id,
            cantidad=stock_update.cantidad,
        )
        session.commit()
        return updated_product
    except ValueError as e:
        session.rollback()
        error_msg = str(e)
        
        if "not found" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=error_msg,
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=error_msg,
            )
    except Exception as e:
        session.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while updating the stock",
        )
