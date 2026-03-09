"""
Rutas de inventario: envío del conteo a Odoo y verificación de salud.
"""

import logging
from fastapi import APIRouter, HTTPException
from models.schemas import EnviarInventarioRequest, EnviarInventarioRespuesta

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/inventario", tags=["Inventario"])

# ------------------------------------------------------------------ #
#  Referencia al cliente Odoo (se inyecta desde main.py)               #
# ------------------------------------------------------------------ #
_odoo_client = None

# Mapeo de ubicaciones por defecto (se puede sobreescribir con datos reales de Odoo)
UBICACIONES_DEFAULT = {
    "almacen": None,   # Se resolverá dinámicamente
    "tienda": None,
}


def set_odoo_client(client) -> None:
    """Inyecta la instancia del cliente Odoo."""
    global _odoo_client
    _odoo_client = client


# ------------------------------------------------------------------ #
#  Rutas                                                               #
# ------------------------------------------------------------------ #

@router.get("/salud")
async def verificar_salud():
    """Endpoint de verificación de salud del sistema."""
    odoo_conectado = _odoo_client is not None and _odoo_client.uid is not None
    return {
        "estado": "ok",
        "odoo_conectado": odoo_conectado,
        "mensaje": "Sistema de conteo de inventario funcionando correctamente",
    }


@router.get("/ubicaciones")
async def obtener_ubicaciones():
    """Obtiene las ubicaciones internas disponibles desde Odoo."""
    if not _odoo_client:
        raise HTTPException(status_code=503, detail="Cliente Odoo no configurado")

    try:
        ubicaciones = _odoo_client.obtener_ubicaciones()
        return {"ubicaciones": ubicaciones}
    except Exception as e:
        logger.error("Error obteniendo ubicaciones: %s", e)
        raise HTTPException(status_code=500, detail=f"Error al obtener ubicaciones: {str(e)}")


@router.post("/enviar", response_model=EnviarInventarioRespuesta)
async def enviar_inventario(request: EnviarInventarioRequest):
    """
    Envía el inventario contado a Odoo.
    Solo se envían productos con cantidad > 0.
    """
    if not _odoo_client:
        raise HTTPException(status_code=503, detail="Cliente Odoo no configurado")

    if not request.items:
        raise HTTPException(status_code=400, detail="No hay productos para enviar")

    # Obtener ubicaciones para resolver el ID
    try:
        ubicaciones = _odoo_client.obtener_ubicaciones()
    except Exception as e:
        logger.error("Error obteniendo ubicaciones: %s", e)
        raise HTTPException(status_code=500, detail=f"Error al obtener ubicaciones: {str(e)}")

    # Buscar la ubicación correspondiente
    location_id = None
    ubicacion_lower = request.ubicacion.lower()
    for ubi in ubicaciones:
        nombre_lower = ubi.get("complete_name", "").lower()
        if ubicacion_lower in nombre_lower or ubi.get("name", "").lower() == ubicacion_lower:
            location_id = ubi["id"]
            break

    # Si no se encontró una coincidencia exacta, usar la primera ubicación interna
    if location_id is None and ubicaciones:
        location_id = ubicaciones[0]["id"]
        logger.warning(
            "No se encontró ubicación exacta para '%s', usando la primera: ID %d",
            request.ubicacion, location_id,
        )

    if location_id is None:
        raise HTTPException(
            status_code=400,
            detail=f"No se encontró ninguna ubicación interna en Odoo",
        )

    enviados = 0
    errores: list[str] = []

    for item in request.items:
        if item.cantidad <= 0:
            continue
        try:
            _odoo_client.actualizar_inventario(
                product_id=item.id_odoo,
                cantidad=float(item.cantidad),
                location_id=location_id,
            )
            enviados += 1
            logger.info("✓ Enviado: %s (cantidad: %d)", item.nombre, item.cantidad)
        except Exception as e:
            error_msg = f"Error con {item.nombre} ({item.codigo_barras}): {str(e)}"
            errores.append(error_msg)
            logger.error(error_msg)

    exito = enviados > 0 and len(errores) == 0
    mensaje = f"Se actualizaron {enviados} de {len(request.items)} productos"
    if errores:
        mensaje += f" ({len(errores)} errores)"

    return EnviarInventarioRespuesta(
        exito=exito,
        mensaje=mensaje,
        items_enviados=enviados,
        errores=errores,
    )
