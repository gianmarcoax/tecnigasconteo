"""
Modelos Pydantic para la API de conteo de inventario.
Define las estructuras de datos utilizadas en las peticiones y respuestas.
"""

from pydantic import BaseModel, Field
from typing import Optional


class Producto(BaseModel):
    """Representa un producto con su código de barras."""
    id_odoo: Optional[int] = Field(None, description="ID del producto en Odoo")
    codigo_barras: str = Field(..., description="Código de barras del producto")
    nombre: str = Field(..., description="Nombre del producto")
    cantidad: int = Field(0, ge=0, description="Cantidad contada")


class ProductoRespuesta(BaseModel):
    """Respuesta al buscar un producto por código de barras."""
    encontrado: bool
    producto: Optional[Producto] = None
    mensaje: str = ""


class ItemInventario(BaseModel):
    """Item individual para enviar al inventario de Odoo."""
    id_odoo: int = Field(..., description="ID del producto en Odoo")
    codigo_barras: str
    nombre: str
    cantidad: int = Field(..., gt=0, description="Cantidad contada (debe ser > 0)")


class EnviarInventarioRequest(BaseModel):
    """Petición para enviar el inventario contado a Odoo."""
    ubicacion: str = Field(..., description="Ubicación: 'almacen' o 'tienda'")
    items: list[ItemInventario]


class EnviarInventarioRespuesta(BaseModel):
    """Respuesta tras enviar inventario a Odoo."""
    exito: bool
    mensaje: str
    items_enviados: int = 0
    errores: list[str] = []
