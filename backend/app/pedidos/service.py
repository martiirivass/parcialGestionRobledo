"""
Service de pedidos - Lógica de negocio
"""
import json
from typing import Optional, List, Tuple
from datetime import datetime
from sqlmodel import select, and_

from app.uow import UnitOfWork
from app.models.catalogo import Producto
from app.models.usuario import Usuario
from app.models.ventas import EstadoPedido, Pedido, DetallePedido, HistorialEstadoPedido
from app.pedidos import schemas
from app.pedidos.enums import (
    es_transicion_valida, 
    es_estado_terminal, 
    puede_cliente_cancelar,
    EstadoPedidoEnum,
    ESTADOS_CON_STOCK,
    ESTADOS_CANCELABLES_SOLO_ADMIN,
)


class PedidoService:
    """Servicio de pedidos con lógica de negocio"""
    
    def __init__(self, uow: UnitOfWork):
        self.uow = uow
    
    # ========== Helpers ==========
    
    def _get_estado_por_nombre(self, nombre: str) -> EstadoPedido:
        """Obtiene un estado de pedido por su nombre"""
        estado = self.uow.session.exec(
            select(EstadoPedido).where(EstadoPedido.nombre == nombre)
        ).first()
        if not estado:
            raise ValueError(f"Estado de pedido '{nombre}' no encontrado")
        return estado
    
    def _get_productos_para_stock(self, producto_ids: List[int]) -> List[Producto]:
        """Obtiene productos con bloqueo para validación de stock"""
        productos = self.uow.session.exec(
            select(Producto).where(Producto.id.in_(producto_ids))
        ).all()
        return productos
    
    def _calcular_total(self, items: List[schemas.ItemPedidoRequest]) -> float:
        """Calcula el total del pedido (sin costo de envío)"""
        producto_ids = [item.producto_id for item in items]
        productos = self._get_productos_para_stock(producto_ids)
        
        total = 0.0
        for item in items:
            producto = next((p for p in productos if p.id == item.producto_id), None)
            if producto:
                total += producto.precio_base * item.cantidad
        return total
    
    def _serializar_direccion(self, direccion_id: int) -> str:
        """Serializa la dirección como snapshot"""
        direccion = self.uow.direcciones.get_by_id(direccion_id)
        if not direccion:
            return "{}"
        
        return json.dumps({
            "alias": direccion.alias,
            "linea1": direccion.linea1,
            "linea2": direccion.linea2,
            "ciudad": direccion.ciudad,
            "codigo_postal": direccion.codigo_postal,
        })
    
    # ========== Creación de Pedido ==========
    
    def crear_pedido(
        self,
        usuario_id: int,
        items: List[schemas.ItemPedidoRequest],
        forma_pago_codigo: str,
        direccion_id: Optional[int] = None,
        notas: Optional[str] = None,
        costo_envio: float = 50.0,
    ) -> Tuple[Pedido, List[DetallePedido]]:
        """
        Crea un nuevo pedido de forma atómica.
        Valida stock, crea snapshots, inicializa historial.
        
        Args:
            usuario_id: ID del usuario que crea el pedido
            items: Lista de items del pedido
            forma_pago_codigo: Código de la forma de pago
            direccion_id: ID de la dirección de entrega (opcional)
            notas: Notas adicionales (opcional)
            costo_envio: Costo de envío (default 50)
        
        Returns:
            Tupla (Pedido, List[DetallePedido])
        
        Raises:
            ValueError: Si hay errores de validación
        """
        # 1. Obtener forma de pago
        forma_pago = self.uow.formas_pago.session.exec(
            select(self.uow.formas_pago.model).where(
                self.uow.formas_pago.model.nombre == forma_pago_codigo
            )
        ).first()
        if not forma_pago:
            raise ValueError(f"Forma de pago '{forma_pago_codigo}' no encontrada")
        
        # 2. Validar stock de todos los productos
        producto_ids = [item.producto_id for item in items]
        productos = self._get_productos_para_stock(producto_ids)
        
        for item in items:
            producto = next((p for p in productos if p.id == item.producto_id), None)
            if not producto:
                raise ValueError(f"Producto {item.producto_id} no encontrado")
            if not producto.disponible:
                raise ValueError(f"Producto '{producto.nombre}' no está disponible")
            if producto.stock_cantidad < item.cantidad:
                raise ValueError(
                    f"Stock insuficiente para '{producto.nombre}'. "
                    f"Solicitado: {item.cantidad}, Disponible: {producto.stock_cantidad}"
                )
        
        # 3. Obtener estado inicial PENDIENTE
        estado_pendiente = self._get_estado_por_nombre(EstadoPedidoEnum.PENDIENTE.value)
        
        # 4. Serializar dirección si existe
        direccion_snapshot = self._serializar_direccion(direccion_id) if direccion_id else "{}"
        
        # 5. Calcular total (suma de subtotales + costo_envio)
        subtotal = self._calcular_total(items)
        total = subtotal + costo_envio
        
        # 6. Crear pedido
        pedido = Pedido(
            usuario_id=usuario_id,
            estado_id=estado_pendiente.id,
            direccion_id=direccion_id,
            forma_pago_id=forma_pago.id,
            direccion_snapshot=direccion_snapshot,
            costo_envio=costo_envio,
            total=total,
            notas=notas,
        )
        self.uow.session.add(pedido)
        self.uow.session.flush()  # Obtener ID del pedido
        
        # 7. Crear detalles con snapshots
        detalles = []
        for item in items:
            producto = next((p for p in productos if p.id == item.producto_id), None)
            subtotal_item = producto.precio_base * item.cantidad
            
            detalle = DetallePedido(
                pedido_id=pedido.id,
                producto_id=producto.id,
                cantidad=item.cantidad,
                precio_snapshot=producto.precio_base,
                nombre_snapshot=producto.nombre,
                subtotal=subtotal_item,
                personalizacion=json.dumps(item.personalizacion) if item.personalizacion else None,
            )
            self.uow.session.add(detalle)
            detalles.append(detalle)
        
        # 8. Crear primer registro de historial (estado_desde = NULL)
        historial = HistorialEstadoPedido(
            pedido_id=pedido.id,
            estado_anterior_id=None,
            estado_nuevo_id=estado_pendiente.id,
            usuario_id=usuario_id,
            observacion="Pedido creado",
        )
        self.uow.session.add(historial)
        
        # El commit se hace automáticamente al salir del contexto UoW
        return pedido, detalles
    
    # ========== Lectura de Pedidos ==========
    
    def listar_pedidos(
        self,
        usuario_id: Optional[int] = None,
        skip: int = 0,
        limit: int = 20,
    ) -> Tuple[List[dict], int]:
        """
        Lista pedidos con paginación.
        Si usuario_id es provided, solo retorna pedidos de ese usuario.
        Retorna dicts con estado_nombre ya incluido.
        """
        query = select(Pedido).where(Pedido.eliminado_en == None)
        
        if usuario_id:
            query = query.where(Pedido.usuario_id == usuario_id)
        
        # Contar total
        total = len(self.uow.session.exec(query).all())
        
        # Aplicar paginación
        query = query.order_by(Pedido.creado_en.desc()).offset(skip).limit(limit)
        pedidos = self.uow.session.exec(query).all()
        
        # Convertir a dicts con estado_nombre
        result = []
        for pedido in pedidos:
            # Cargar estado
            self.uow.session.refresh(pedido, ["estado"])
            result.append({
                "id": pedido.id,
                "usuario_id": pedido.usuario_id,
                "estado_nombre": pedido.estado.nombre if hasattr(pedido, 'estado') else "PENDIENTE",
                "total": pedido.total,
                "creado_en": pedido.creado_en,
            })
        
        return result, total
    
    def obtener_pedido(self, pedido_id: int, usuario_id: int, roles: List[str]) -> Pedido:
        """
        Obtiene un pedido por ID.
        Si es CLIENT, solo puede ver sus propios pedidos.
        """
        pedido = self.uow.pedidos.get_by_id(pedido_id)
        if not pedido:
            raise ValueError(f"Pedido {pedido_id} no encontrado")
        
        # Verificar acceso
        es_admin_o_pedidos = "ADMIN" in roles or "PEDIDOS" in roles
        if not es_admin_o_pedidos and pedido.usuario_id != usuario_id:
            raise ValueError("No tienes acceso a este pedido")
        
        return pedido
    
    def obtener_pedido_detail(self, pedido_id: int, usuario_id: int, roles: List[str]) -> dict:
        """
        Obtiene pedido con todos los detalles, items e historial.
        """
        pedido = self.obtener_pedido(pedido_id, usuario_id, roles)
        
        # Cargar relaciones
        self.uow.session.refresh(pedido, ["estado", "detalles", "historial", "forma_pago"])
        
        # Obtener historial ordenado
        historial = self.uow.session.exec(
            select(HistorialEstadoPedido)
            .where(HistorialEstadoPedido.pedido_id == pedido_id)
            .order_by(HistorialEstadoPedido.creado_en.asc())
        ).all()
        
        return {
            "pedido": pedido,
            "detalles": pedido.detalles,
            "historial": historial,
        }
    
    def obtener_historial(self, pedido_id: int, usuario_id: int, roles: List[str]) -> List[HistorialEstadoPedido]:
        """
        Obtiene el historial de estados de un pedido.
        """
        # Verificar acceso primero
        self.obtener_pedido(pedido_id, usuario_id, roles)
        
        historial = self.uow.session.exec(
            select(HistorialEstadoPedido)
            .where(HistorialEstadoPedido.pedido_id == pedido_id)
            .order_by(HistorialEstadoPedido.creado_en.asc())
        ).all()
        
        return historial
    
    # ========== Cambio de Estado (FSM) ==========
    
    def cambiar_estado(
        self,
        pedido_id: int,
        nuevo_estado: str,
        usuario_id: int,
        roles: List[str],
        observacion: Optional[str] = None,
    ) -> Pedido:
        """
        Cambia el estado de un pedido validando la FSM.
        Maneja decremento/restauración de stock automáticamente.
        
        Args:
            pedido_id: ID del pedido
            nuevo_estado: Nuevo código de estado
            usuario_id: ID del usuario que ejecuta el cambio
            roles: Roles del usuario (para validar permisos)
            observacion: Observación opcional
        
        Returns:
            Pedido actualizado
        
        Raises:
            ValueError: Si la transición no es válida
        """
        # Obtener pedido
        pedido = self.obtener_pedido(pedido_id, usuario_id, roles)
        
        # Cargar estado actual
        self.uow.session.refresh(pedido, ["estado"])
        estado_actual = pedido.estado.nombre
        
        # Verificar si es estado terminal
        if es_estado_terminal(estado_actual):
            raise ValueError(f"El pedido ya está en estado terminal '{estado_actual}'")
        
        # Validar transición
        if not es_transicion_valida(estado_actual, nuevo_estado):
            raise ValueError(
                f"Transición no permitida: de '{estado_actual}' a '{nuevo_estado}'"
            )
        
        # Validar permisos especiales
        # Solo ADMIN puede cancelar desde EN_PREPARACION
        if nuevo_estado == EstadoPedidoEnum.CANCELADO.value:
            if estado_actual in [e.value for e in ESTADOS_CANCELABLES_SOLO_ADMIN]:
                if "ADMIN" not in roles:
                    raise ValueError(
                        "Solo ADMIN puede cancelar pedidos en estado EN_PREPARACIÓN"
                    )
        
        # Obtener nuevo estado
        nuevo_estado_obj = self._get_estado_por_nombre(nuevo_estado)
        
        # Guardar estado anterior para el historial
        estado_anterior_id = pedido.estado_id
        
        # Actualizar pedido
        pedido.estado_id = nuevo_estado_obj.id
        pedido.actualizado_en = datetime.utcnow()
        self.uow.session.add(pedido)
        
        # Crear historial
        historial = HistorialEstadoPedido(
            pedido_id=pedido.id,
            estado_anterior_id=estado_anterior_id,
            estado_nuevo_id=nuevo_estado_obj.id,
            usuario_id=usuario_id,
            observacion=observacion,
        )
        self.uow.session.add(historial)
        
        # Manejo de stock
        if nuevo_estado == EstadoPedidoEnum.CONFIRMADO.value:
            # Decrementar stock
            self._decrementar_stock(pedido)
        elif nuevo_estado == EstadoPedidoEnum.CANCELADO.value:
            # Verificar si hay que restaurar stock
            if estado_actual in [e.value for e in ESTADOS_CON_STOCK]:
                self._restaurar_stock(pedido)
        
        # Cargar estado para retornar el nombre
        self.uow.session.refresh(pedido, ["estado"])
        
        return pedido
    
    def _decrementar_stock(self, pedido: Pedido):
        """Decrementa el stock de los productos del pedido"""
        # Cargar detalles
        self.uow.session.refresh(pedido, ["detalles"])
        
        for detalle in pedido.detalles:
            producto = self.uow.session.get(Producto, detalle.producto_id)
            if producto:
                producto.stock_cantidad -= detalle.cantidad
                if producto.stock_cantidad < 0:
                    producto.stock_cantidad = 0
                self.uow.session.add(producto)
    
    def _restaurar_stock(self, pedido: Pedido):
        """Restaura el stock de los productos del pedido"""
        # Cargar detalles
        self.uow.session.refresh(pedido, ["detalles"])
        
        for detalle in pedido.detalles:
            producto = self.uow.session.get(Producto, detalle.producto_id)
            if producto:
                producto.stock_cantidad += detalle.cantidad
                self.uow.session.add(producto)
    
    # ========== Cancelar Pedido (Cliente) ==========
    
    def cancelar_pedido(
        self,
        pedido_id: int,
        usuario_id: int,
        observacion: Optional[str] = None,
    ) -> Pedido:
        """
        Cancela un pedido (solo el cliente puede hacerlo desde PENDIENTE o CONFIRMADO).
        """
        # Obtener pedido
        pedido = self.uow.pedidos.get_by_id(pedido_id)
        if not pedido:
            raise ValueError(f"Pedido {pedido_id} no encontrado")
        
        # Verificar que es el propietario
        if pedido.usuario_id != usuario_id:
            raise ValueError("No puedes cancelar un pedido que no es tuyo")
        
        # Cargar estado actual
        self.uow.session.refresh(pedido, ["estado"])
        estado_actual = pedido.estado.nombre
        
        # Validar que puede cancelar
        if not puede_cliente_cancelar(estado_actual):
            raise ValueError(
                f"No puedes cancelar un pedido en estado '{estado_actual}'. "
                f"Solo puedes cancelar en estado PENDIENTE o CONFIRMADO."
            )
        
        # Obtener estado CANCELADO
        estado_cancelado = self._get_estado_por_nombre(EstadoPedidoEnum.CANCELADO.value)
        
        # Guardar estado anterior
        estado_anterior_id = pedido.estado_id
        
        # Actualizar pedido
        pedido.estado_id = estado_cancelado.id
        pedido.actualizado_en = datetime.utcnow()
        self.uow.session.add(pedido)
        
        # Crear historial
        historial = HistorialEstadoPedido(
            pedido_id=pedido.id,
            estado_anterior_id=estado_anterior_id,
            estado_nuevo_id=estado_cancelado.id,
            usuario_id=usuario_id,
            observacion=observacion or "Cancelado por el cliente",
        )
        self.uow.session.add(historial)
        
        # Restaurar stock si estaba en estado que lo tiene
        if estado_actual in [e.value for e in ESTADOS_CON_STOCK]:
            self._restaurar_stock(pedido)
        
        return pedido