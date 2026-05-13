"""
Enums y constantes para la máquina de estados de pedidos
"""
from enum import Enum
from typing import Dict, Set

class EstadoPedidoEnum(str, Enum):
    """Estados del pedido según la FSM"""
    PENDIENTE = "PENDIENTE"
    CONFIRMADO = "CONFIRMADO"
    EN_PREPARACION = "EN_PREPARACION"
    EN_CAMINO = "EN_CAMINO"
    ENTREGADO = "ENTREGADO"
    CANCELADO = "CANCELADO"


# Mapa de transiciones válidas de la FSM
# clave: estado actual -> valor: conjunto de estados destino válidos
TRANSICIONES_FSM: Dict[EstadoPedidoEnum, Set[EstadoPedidoEnum]] = {
    EstadoPedidoEnum.PENDIENTE: {
        EstadoPedidoEnum.CONFIRMADO,
        EstadoPedidoEnum.CANCELADO,
    },
    EstadoPedidoEnum.CONFIRMADO: {
        EstadoPedidoEnum.EN_PREPARACION,
        EstadoPedidoEnum.CANCELADO,
    },
    EstadoPedidoEnum.EN_PREPARACION: {
        EstadoPedidoEnum.EN_CAMINO,
        EstadoPedidoEnum.CANCELADO,  # Solo ADMIN según RN-08
    },
    EstadoPedidoEnum.EN_CAMINO: {
        EstadoPedidoEnum.ENTREGADO,
    },
    EstadoPedidoEnum.ENTREGADO: set(),  # Estado terminal - no hay transiciones salientes
    EstadoPedidoEnum.CANCELADO: set(),  # Estado terminal - no hay transiciones salientes
}

# Estados que requieren stock restoration al cancelar
ESTADOS_CON_STOCK: Set[EstadoPedidoEnum] = {
    EstadoPedidoEnum.CONFIRMADO,
    EstadoPedidoEnum.EN_PREPARACION,
    EstadoPedidoEnum.EN_CAMINO,
}

# Estados desde los cuales el cliente puede cancelar
ESTADOS_CANCELABLES_POR_CLIENTE: Set[EstadoPedidoEnum] = {
    EstadoPedidoEnum.PENDIENTE,
    EstadoPedidoEnum.CONFIRMADO,
}

# Estados desde los cuales SOLO admin puede cancelar
ESTADOS_CANCELABLES_SOLO_ADMIN: Set[EstadoPedidoEnum] = {
    EstadoPedidoEnum.EN_PREPARACION,
}


def es_transicion_valida(estado_actual: str, estado_nuevo: str) -> bool:
    """
    Valida si una transición de estado es válida según la FSM.
    
    Args:
        estado_actual: Estado actual del pedido (nombre)
        estado_nuevo: Estado al que se quiere transiciónar (nombre)
    
    Returns:
        True si la transición es válida, False en caso contrario
    """
    try:
        actual = EstadoPedidoEnum(estado_actual)
        nuevo = EstadoPedidoEnum(estado_nuevo)
        return nuevo in TRANSICIONES_FSM.get(actual, set())
    except ValueError:
        # Si el estado no es válido, la transición no es válida
        return False


def es_estado_terminal(estado: str) -> bool:
    """Verifica si un estado es terminal (no admite más transiciones)"""
    try:
        estado_enum = EstadoPedidoEnum(estado)
        return len(TRANSICIONES_FSM.get(estado_enum, set())) == 0
    except ValueError:
        return False


def puede_cliente_cancelar(estado: str) -> bool:
    """Verifica si el cliente puede cancelar un pedido en este estado"""
    try:
        return EstadoPedidoEnum(estado) in ESTADOS_CANCELABLES_POR_CLIENTE
    except ValueError:
        return False