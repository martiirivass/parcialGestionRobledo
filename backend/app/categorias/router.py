"""
Categorias Router - Category management endpoints
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlmodel import Session

from app.core.database import get_session_context
from app.core.dependencies import get_current_user
from app.models.usuario import Usuario
from app.categorias.schemas import (
    CategoryCreate,
    CategoryUpdate,
    CategoryResponse,
    CategoryTreeNode,
    ErrorResponse,
)
from app.categorias.service import CategoryService


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
    response_model=CategoryResponse,
    status_code=201,
    responses={
        400: {"model": ErrorResponse, "description": "Validation error or cycle detected"},
        403: {"model": ErrorResponse, "description": "Insufficient permissions"},
        404: {"model": ErrorResponse, "description": "Parent category not found"},
        409: {"model": ErrorResponse, "description": "Duplicate name"},
    },
)
async def create_category(
    category_data: CategoryCreate,
    current_user: Usuario = Depends(get_current_user),
    session: Session = Depends(get_session_context),
):
    """
    Create a new category (admin/stock only).
    
    Creates a new product category with optional parent-child relationship.
    Parent categories can be used to organize products hierarchically.
    
    **Authorization**: Requires ADMIN or STOCK role
    
    **Validations**:
    - Parent category must exist (if provided)
    - Category name must be unique within the same parent
    - Cannot create cycles (A → B → C → A)
    - Name must be 1-100 characters
    """
    # Check authorization
    require_admin_or_stock(current_user)
    try:
        service = CategoryService(session)
        new_category = service.create_category(
            nombre=category_data.nombre,
            parent_id=category_data.padre_id
        )
        session.commit()
        return new_category
    except ValueError as e:
        session.rollback()
        error_msg = str(e)
        
        if "already exists" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=error_msg,
            )
        elif "not found" in error_msg:
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
            detail="An error occurred while creating the category",
        )


@router.get(
    "/",
    response_model=List[CategoryTreeNode],
    status_code=200,
    responses={
        200: {"description": "Category tree retrieved successfully"},
    },
)
async def list_categories(
    session: Session = Depends(get_session_context),
):
    """
    Get complete category hierarchy as nested tree (public endpoint).
    
    Returns all non-deleted categories organized in a hierarchical structure.
    Suitable for frontend navigation and category browsing.
    
    **Authorization**: No authentication required
    
    **Response**:
    Returns a nested tree structure where each category can have subcategorias
    with the same structure (recursive).
    """
    try:
        service = CategoryService(session)
        tree = service.get_category_tree()
        
        # Convert to response models
        def dict_to_response(item: dict) -> CategoryTreeNode:
            return CategoryTreeNode(
                id=item["id"],
                nombre=item["nombre"],
                padre_id=item["padre_id"],
                subcategorias=[dict_to_response(sub) for sub in item["subcategorias"]]
            )
        
        return [dict_to_response(item) for item in tree]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while retrieving categories",
        )


@router.get(
    "/{category_id}",
    response_model=CategoryResponse,
    status_code=200,
    responses={
        403: {"model": ErrorResponse, "description": "Insufficient permissions"},
        404: {"model": ErrorResponse, "description": "Category not found"},
    },
)
async def get_category(
    category_id: int,
    include_deleted: bool = Query(False, description="Include soft-deleted categories"),
    current_user: Usuario = Depends(get_current_user),
    session: Session = Depends(get_session_context),
):
    """
    Get a single category by ID (admin/stock only).
    
    Returns detailed information about a specific category.
    
    **Authorization**: Requires ADMIN or STOCK role
    
    **Parameters**:
    - `include_deleted`: Include soft-deleted categories in result (default: false)
    """
    # Check authorization
    require_admin_or_stock(current_user)
    try:
        service = CategoryService(session)
        category = service.get_category_by_id(category_id, include_deleted=include_deleted)
        
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Category with id {category_id} not found",
            )
        
        return category
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while retrieving the category",
        )


@router.put(
    "/{category_id}",
    response_model=CategoryResponse,
    status_code=200,
    responses={
        400: {"model": ErrorResponse, "description": "Validation error or cycle detected"},
        403: {"model": ErrorResponse, "description": "Insufficient permissions"},
        404: {"model": ErrorResponse, "description": "Category not found"},
    },
)
async def update_category(
    category_id: int,
    category_data: CategoryUpdate,
    current_user: Usuario = Depends(get_current_user),
    session: Session = Depends(get_session_context),
):
    """
    Update a category (admin/stock only).
    
    Updates category name and/or parent. Can only update one or both fields.
    
    **Authorization**: Requires ADMIN or STOCK role
    
    **Validations**:
    - Category must exist
    - New parent must exist (if changing)
    - Cannot create cycles
    - Name must be unique within the new parent
    """
    # Check authorization
    require_admin_or_stock(current_user)
    try:
        service = CategoryService(session)
        updated_category = service.update_category(
            category_id=category_id,
            nombre=category_data.nombre,
            parent_id=category_data.padre_id
        )
        session.commit()
        return updated_category
    except ValueError as e:
        session.rollback()
        error_msg = str(e)
        
        if "not found" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=error_msg,
            )
        elif "cycle" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
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
            detail="An error occurred while updating the category",
        )


@router.delete(
    "/{category_id}",
    status_code=204,
    responses={
        403: {"model": ErrorResponse, "description": "Insufficient permissions"},
        404: {"model": ErrorResponse, "description": "Category not found"},
        409: {"model": ErrorResponse, "description": "Category has active products"},
    },
)
async def delete_category(
    category_id: int,
    current_user: Usuario = Depends(get_current_user),
    session: Session = Depends(get_session_context),
):
    """
    Soft delete a category (admin/stock only).
    
    Marks a category as deleted without removing it from the database.
    Preserves audit trail for analytics.
    
    **Authorization**: Requires ADMIN or STOCK role
    
    **Validations**:
    - Category must exist
    - Category must not have active products (in this category or descendants)
    
    **Returns**: 204 No Content on success
    """
    # Check authorization
    require_admin_or_stock(current_user)
    try:
        service = CategoryService(session)
        service.delete_category(category_id)
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
        elif "have" in error_msg or "active products" in error_msg:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
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
            detail="An error occurred while deleting the category",
        )
