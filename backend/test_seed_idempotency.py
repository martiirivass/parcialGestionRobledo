"""
Script de prueba - Ejecutar seed 2 veces para verificar idempotencia
"""
import sys
import os

# Add backend to path
sys.path.insert(0, os.path.dirname(__file__))

from app.db.seed import seed_database

if __name__ == "__main__":
    print("=" * 60)
    print("PRUEBA DE IDEMPOTENCIA - EJECUCIÓN 1")
    print("=" * 60)
    try:
        seed_database()
    except Exception as e:
        print(f"❌ Error en ejecución 1: {e}")
        sys.exit(1)
    
    print("\n" + "=" * 60)
    print("PRUEBA DE IDEMPOTENCIA - EJECUCIÓN 2")
    print("=" * 60)
    try:
        seed_database()
        print("\n✅ IDEMPOTENCIA VERIFICADA: El seed se ejecutó 2 veces sin errores\n")
    except Exception as e:
        print(f"❌ Error en ejecución 2: {e}")
        sys.exit(1)
