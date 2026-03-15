"""
Punto de entrada principal del backend – Conteo de Inventario para Odoo.
Configura FastAPI, CORS, y registra las rutas.
"""

import logging
import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from odoo_client import OdooClient
from routes.products import router as productos_router, set_odoo_client as set_productos_odoo
from routes.inventory import router as inventario_router, set_odoo_client as set_inventario_odoo

# ------------------------------------------------------------------ #
#  Configuración de logging                                            #
# ------------------------------------------------------------------ #

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

# ------------------------------------------------------------------ #
#  Variables de entorno                                                #
# ------------------------------------------------------------------ #

load_dotenv(".env")

ODOO_URL = os.getenv("ODOO_URL", "https://tecnigass.pe")
ODOO_DB = os.getenv("ODOO_DB", "db_tecnigas")
ODOO_USER = os.getenv("ODOO_USER", "coadmin@gmail.com")
ODOO_API_KEY = os.getenv("ODOO_API_KEY", "2dab421e59ee24e0b4c81f77717250ddd93f8a83")


# ------------------------------------------------------------------ #
#  Ciclo de vida de la app                                             #
# ------------------------------------------------------------------ #

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Ejecuta tareas al iniciar y finalizar la aplicación."""
    # -- Inicio --
    logger.info("=" * 60)
    logger.info("  Conteo de Inventario – Tecnigas")
    logger.info("=" * 60)

    if all([ODOO_URL, ODOO_DB, ODOO_USER, ODOO_API_KEY]):
        try:
            cliente = OdooClient(
                url=ODOO_URL,
                db=ODOO_DB,
                user=ODOO_USER,
                api_key=ODOO_API_KEY,
            )
            cliente.autenticar()
            set_productos_odoo(cliente)
            set_inventario_odoo(cliente)
            logger.info("Conexión a Odoo establecida correctamente.")
        except Exception as e:
            logger.error("No se pudo conectar a Odoo: %s", e)
            logger.warning("La app se ejecutará sin conexión a Odoo.")
    else:
        logger.warning("Variables de entorno de Odoo no configuradas. Revise el archivo .env")

    yield

    # -- Cierre --
    logger.info("Cerrando la aplicación...")


# ------------------------------------------------------------------ #
#  Crear aplicación                                                    #
# ------------------------------------------------------------------ #

app = FastAPI(
    title="Conteo de Inventario – Tecnigas",
    description="API para conteo de inventario con escáner de código de barras y sincronización con Odoo",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS – permitir el frontend de desarrollo y dispositivos en la red local
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Permitir acceso desde celulares y otras IPs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Registrar rutas
app.include_router(productos_router)
app.include_router(inventario_router)


@app.get("/")
async def raiz():
    """Ruta raíz con información básica de la API."""
    return {
        "aplicacion": "Conteo de Inventario – Tecnigas",
        "version": "1.0.0",
        "documentacion": "/docs",
        "estado": "/api/inventario/salud",
    }
