"""
Seed script - Datos iniciales para la base de datos (idempotente)
"""
from sqlmodel import Session, select
from app.core.database import engine
from app.core.config import settings
from app.core.security import hash_password
from app.models.usuario import Usuario, Rol, UsuarioRol
from app.models.catalogo import FormaPago
from app.models.ventas import EstadoPedido


def seed_roles(session: Session) -> None:
    """
    4.2 Insertar 4 Roles (ADMIN=1, STOCK=2, PEDIDOS=3, CLIENT=4)
    - Idempotente: verifica si existen antes de insertar
    """
    roles_data = [
        {"id": 1, "nombre": "ADMIN", "descripcion": "Administrador del sistema"},
        {"id": 2, "nombre": "STOCK", "descripcion": "Gestión de stock e inventario"},
        {"id": 3, "nombre": "PEDIDOS", "descripcion": "Gestión de pedidos"},
        {"id": 4, "nombre": "CLIENT", "descripcion": "Cliente de la tienda"},
    ]
    
    for rol_data in roles_data:
        # Buscar si el rol ya existe
        existing = session.exec(select(Rol).where(Rol.id == rol_data["id"])).first()
        if not existing:
            rol = Rol(**rol_data)
            session.add(rol)
            print("[+] Rol creado: {}".format(rol_data['nombre']))
        else:
            print("[*] Rol ya existe: {}".format(rol_data['nombre']))


def seed_estados_pedido(session: Session) -> None:
    """
    4.3 Insertar 6 EstadosPedido (PENDIENTE=1 a CANCELADO=6)
    - Idempotente: verifica si existen antes de insertar
    """
    estados_data = [
        {"id": 1, "nombre": "PENDIENTE", "descripcion": "Pedido pendiente de confirmación"},
        {"id": 2, "nombre": "CONFIRMADO", "descripcion": "Pedido confirmado por el vendedor"},
        {"id": 3, "nombre": "EN_PREPARACION", "descripcion": "Pedido en proceso de preparación"},
        {"id": 4, "nombre": "LISTO_PARA_ENVIO", "descripcion": "Pedido listo para enviar"},
        {"id": 5, "nombre": "ENVIADO", "descripcion": "Pedido enviado al cliente"},
        {"id": 6, "nombre": "CANCELADO", "descripcion": "Pedido cancelado"},
    ]
    
    for estado_data in estados_data:
        # Buscar si el estado ya existe
        existing = session.exec(
            select(EstadoPedido).where(EstadoPedido.id == estado_data["id"])
        ).first()
        if not existing:
            estado = EstadoPedido(**estado_data)
            session.add(estado)
            print("[+] Estado de pedido creado: {}".format(estado_data['nombre']))
        else:
            print("[*] Estado de pedido ya existe: {}".format(estado_data['nombre']))


def seed_formas_pago(session: Session) -> None:
    """
    4.4 Insertar Formas de Pago (Tarjeta crédito, Tarjeta débito)
    - Idempotente: verifica si existen antes de insertar
    """
    formas_data = [
        {"nombre": "Tarjeta Crédito", "activo": True},
        {"nombre": "Tarjeta Débito", "activo": True},
    ]
    
    for forma_data in formas_data:
        # Buscar si la forma de pago ya existe
        existing = session.exec(
            select(FormaPago).where(FormaPago.nombre == forma_data["nombre"])
        ).first()
        if not existing:
            forma = FormaPago(**forma_data)
            session.add(forma)
            print("[+] Forma de pago creada: {}".format(forma_data['nombre']))
        else:
            print("[*] Forma de pago ya existe: {}".format(forma_data['nombre']))


def seed_admin_user(session: Session) -> None:
    """
    4.5 Crear usuario administrador desde variables de entorno
    - Idempotente: verifica si el admin ya existe antes de insertar
    - Email: admin_email (desde config)
    - Password: admin_password (desde config, hasheada con bcrypt)
    """
    # Buscar si el admin ya existe
    existing_admin = session.exec(
        select(Usuario).where(Usuario.email == settings.admin_email)
    ).first()
    
    if existing_admin:
        print("[*] Usuario admin ya existe: {}".format(settings.admin_email))
        return
    
    # Crear usuario admin
    admin_user = Usuario(
        nombre="Administrador",
        email=settings.admin_email,
        password_hash=hash_password(settings.admin_password),
        telefono=None,
    )
    session.add(admin_user)
    session.flush()  # Flush para obtener el ID
    
    print("[+] Usuario admin creado: {}".format(settings.admin_email))
    
    # Asignar el rol ADMIN (id=1) al usuario
    admin_role = session.exec(select(Rol).where(Rol.id == 1)).first()
    if admin_role:
        usuario_rol = UsuarioRol(
            usuario_id=admin_user.id,
            rol_id=admin_role.id,
        )
        session.add(usuario_rol)
        print("[+] Rol ADMIN asignado al usuario admin")


def seed_database() -> None:
    """
    4.1 Crear script de seed idiopente que:
    - Verifique si los datos ya existen antes de insertar
    - Sea repetible sin causar errores
    """
    print("\n[*] Iniciando seeding de base de datos...\n")
    
    session = Session(engine)
    try:
        # Orden de inserción importante para respetar FKs
        print("[INFO] Insertando Roles...")
        seed_roles(session)
        session.commit()
        
        print("\n[INFO] Insertando Estados de Pedido...")
        seed_estados_pedido(session)
        session.commit()
        
        print("\n[INFO] Insertando Formas de Pago...")
        seed_formas_pago(session)
        session.commit()
        
        print("\n[INFO] Insertando Usuario Administrador...")
        seed_admin_user(session)
        session.commit()
        
        print("\n[SUCCESS] Seeding completado exitosamente!\n")
        
    except Exception as e:
        session.rollback()
        print("\n[ERROR] Error durante seeding: {}\n".format(e))
        raise
    finally:
        session.close()


if __name__ == "__main__":
    seed_database()
