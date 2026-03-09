"""
Cliente Odoo JSON-RPC.
Maneja autenticación y operaciones de inventario contra la API de Odoo.
"""

import logging
import requests
from typing import Optional

logger = logging.getLogger(__name__)


class OdooClient:
    """Cliente para conectarse a Odoo mediante JSON-RPC."""

    def __init__(self, url: str, db: str, user: str, api_key: str) -> None:
        self.url = url.rstrip("/")
        self.db = db
        self.user = user
        self.api_key = api_key
        self.uid: Optional[int] = None
        self._session = requests.Session()

    # ------------------------------------------------------------------ #
    #  JSON-RPC helpers                                                    #
    # ------------------------------------------------------------------ #

    def _json_rpc(self, endpoint: str, servicio: str, metodo: str, args: list) -> dict:
        """Ejecuta una llamada JSON-RPC genérica a Odoo."""
        payload = {
            "jsonrpc": "2.0",
            "method": "call",
            "params": {
                "service": servicio,
                "method": metodo,
                "args": args,
            },
            "id": 1,
        }
        resp = self._session.post(
            f"{self.url}{endpoint}",
            json=payload,
            timeout=30,
        )
        resp.raise_for_status()
        resultado = resp.json()

        if "error" in resultado:
            detalle = resultado["error"].get("data", {}).get("message", str(resultado["error"]))
            raise RuntimeError(f"Error Odoo JSON-RPC: {detalle}")

        return resultado.get("result")

    # ------------------------------------------------------------------ #
    #  Autenticación                                                       #
    # ------------------------------------------------------------------ #

    def autenticar(self) -> int:
        """Autentica al usuario y devuelve el UID."""
        logger.info("Autenticando en Odoo: %s (DB: %s, Usuario: %s)", self.url, self.db, self.user)
        uid = self._json_rpc(
            "/jsonrpc",
            "common",
            "login",
            [self.db, self.user, self.api_key],
        )
        if not uid:
            raise RuntimeError("Autenticación fallida: credenciales inválidas.")
        self.uid = uid
        logger.info("Autenticación exitosa. UID: %d", uid)
        return uid

    # ------------------------------------------------------------------ #
    #  Operaciones con modelos                                             #
    # ------------------------------------------------------------------ #

    def _ejecutar(self, modelo: str, metodo: str, args: list, kwargs: Optional[dict] = None):
        """Ejecuta un método en un modelo de Odoo."""
        if self.uid is None:
            self.autenticar()
        return self._json_rpc(
            "/jsonrpc",
            "object",
            "execute_kw",
            [self.db, self.uid, self.api_key, modelo, metodo, args, kwargs or {}],
        )

    # ------------------------------------------------------------------ #
    #  Productos                                                           #
    # ------------------------------------------------------------------ #

    def buscar_producto_por_codigo(self, codigo_barras: str) -> Optional[dict]:
        """
        Busca un producto por su código de barras en Odoo.
        Devuelve {id, barcode, name} o None si no se encontró.
        """
        logger.info("Buscando producto con código de barras: %s", codigo_barras)
        resultados = self._ejecutar(
            "product.product",
            "search_read",
            [[["barcode", "=", codigo_barras]]],
            {"fields": ["id", "barcode", "name", "default_code"], "limit": 1},
        )
        if resultados:
            prod = resultados[0]
            logger.info("Producto encontrado: %s (ID: %d)", prod["name"], prod["id"])
            return {
                "id": prod["id"],
                "barcode": prod.get("barcode", codigo_barras),
                "name": prod.get("name", ""),
                "default_code": prod.get("default_code", ""),
            }
        logger.warning("Producto NO encontrado para código: %s", codigo_barras)
        return None

    # ------------------------------------------------------------------ #
    #  Inventario                                                          #
    # ------------------------------------------------------------------ #

    def actualizar_inventario(
        self,
        product_id: int,
        cantidad: float,
        location_id: int,
    ) -> bool:
        """
        Actualiza la cantidad en inventario de un producto en una ubicación.
        Usa stock.quant con action_apply_inventory para forzar el conteo.
        """
        logger.info(
            "Actualizando inventario: producto=%d, cantidad=%.2f, ubicación=%d",
            product_id, cantidad, location_id,
        )
        try:
            # Buscar quant existente
            quants = self._ejecutar(
                "stock.quant",
                "search_read",
                [[
                    ["product_id", "=", product_id],
                    ["location_id", "=", location_id],
                ]],
                {"fields": ["id", "inventory_quantity"], "limit": 1},
            )

            if quants:
                quant_id = quants[0]["id"]
                # Escribir la cantidad de inventario
                self._ejecutar(
                    "stock.quant",
                    "write",
                    [[quant_id], {"inventory_quantity": cantidad}],
                )
            else:
                # Crear quant nuevo
                quant_id = self._ejecutar(
                    "stock.quant",
                    "create",
                    [{"product_id": product_id, "location_id": location_id, "inventory_quantity": cantidad}],
                )

            # Aplicar el ajuste de inventario
            self._ejecutar(
                "stock.quant",
                "action_apply_inventory",
                [[quant_id if isinstance(quant_id, int) else quant_id]],
            )

            logger.info("Inventario actualizado correctamente para producto %d", product_id)
            return True

        except Exception as e:
            logger.error("Error actualizando inventario del producto %d: %s", product_id, e)
            raise

    # ------------------------------------------------------------------ #
    #  Ubicaciones                                                         #
    # ------------------------------------------------------------------ #

    def obtener_ubicaciones(self) -> list[dict]:
        """Devuelve las ubicaciones internas disponibles en el almacén."""
        resultados = self._ejecutar(
            "stock.location",
            "search_read",
            [[["usage", "=", "internal"]]],
            {"fields": ["id", "complete_name", "name"], "limit": 50},
        )
        return resultados or []

    # ------------------------------------------------------------------ #
    #  Stock a la mano y último movimiento                                 #
    # ------------------------------------------------------------------ #

    def obtener_stock_a_la_mano(self, product_id: int) -> list[dict]:
        """
        Devuelve la cantidad a la mano (quantity) de un producto
        en todas las ubicaciones internas.
        Retorna una lista: [{location_id, location_name, quantity}]
        """
        logger.info("Consultando stock a la mano para producto %d", product_id)
        try:
            quants = self._ejecutar(
                "stock.quant",
                "search_read",
                [[
                    ["product_id", "=", product_id],
                    ["location_id.usage", "=", "internal"],
                ]],
                {"fields": ["location_id", "quantity"], "limit": 50},
            )
            resultado = []
            for q in (quants or []):
                loc = q.get("location_id")
                resultado.append({
                    "location_id": loc[0] if isinstance(loc, (list, tuple)) else loc,
                    "location_name": loc[1] if isinstance(loc, (list, tuple)) else str(loc),
                    "quantity": q.get("quantity", 0),
                })
            return resultado
        except Exception as e:
            logger.error("Error obteniendo stock a la mano: %s", e)
            return []

    def obtener_ultimo_movimiento(self, product_id: int) -> Optional[str]:
        """
        Devuelve la fecha/hora del último movimiento de stock (stock.move.line)
        para un producto. Retorna un string ISO o None.
        """
        logger.info("Consultando último movimiento para producto %d", product_id)
        try:
            movimientos = self._ejecutar(
                "stock.move.line",
                "search_read",
                [[["product_id", "=", product_id], ["state", "=", "done"]]],
                {"fields": ["date"], "order": "date desc", "limit": 1},
            )
            if movimientos:
                return movimientos[0].get("date", None)
            return None
        except Exception as e:
            logger.error("Error obteniendo último movimiento: %s", e)
            return None

    # ------------------------------------------------------------------ #
    #  Categorías y stock por categoría                                    #
    # ------------------------------------------------------------------ #

    def obtener_categorias(self) -> list[dict]:
        """
        Devuelve todas las categorías de productos disponibles en Odoo.
        Retorna [{id, name, complete_name}]
        """
        logger.info("Consultando categorías de productos")
        try:
            categorias = self._ejecutar(
                "product.category",
                "search_read",
                [[]],
                {"fields": ["id", "name", "complete_name"], "order": "complete_name asc", "limit": 200},
            )
            return categorias or []
        except Exception as e:
            logger.error("Error obteniendo categorías: %s", e)
            return []

    def obtener_productos_por_categoria(self, categoria_id: int) -> list[dict]:
        """
        Devuelve los productos de una categoría con su stock a la mano
        en ubicaciones internas.
        Retorna [{id, name, default_code, barcode, stock_por_ubicacion, total_stock}]
        """
        logger.info("Consultando productos de categoría %d", categoria_id)
        try:
            # 1. Obtener product.template de la categoría
            templates = self._ejecutar(
                "product.template",
                "search_read",
                [[["categ_id", "=", categoria_id]]],
                {"fields": ["id", "name"], "limit": 500},
            )
            if not templates:
                return []

            template_ids = [t["id"] for t in templates]
            template_name = {t["id"]: t["name"] for t in templates}

            # 2. Obtener product.product (variantes) de esos templates
            productos = self._ejecutar(
                "product.product",
                "search_read",
                [[["product_tmpl_id", "in", template_ids]]],
                {"fields": ["id", "name", "default_code", "barcode", "product_tmpl_id"], "limit": 1000},
            )
            if not productos:
                return []

            product_ids = [p["id"] for p in productos]

            # 3. Obtener stock.quant (stock a la mano) de esos productos
            quants = self._ejecutar(
                "stock.quant",
                "search_read",
                [[
                    ["product_id", "in", product_ids],
                    ["location_id.usage", "=", "internal"],
                ]],
                {"fields": ["product_id", "location_id", "quantity"], "limit": 5000},
            )

            # Agrupar quants por producto
            stock_map: dict[int, list] = {}
            for q in (quants or []):
                pid = q["product_id"][0] if isinstance(q["product_id"], (list, tuple)) else q["product_id"]
                loc = q.get("location_id")
                entry = {
                    "location_id": loc[0] if isinstance(loc, (list, tuple)) else loc,
                    "location_name": loc[1] if isinstance(loc, (list, tuple)) else str(loc),
                    "quantity": q.get("quantity", 0),
                }
                stock_map.setdefault(pid, []).append(entry)

            # Construir resultado
            resultado = []
            for p in productos:
                pid = p["id"]
                stock_locs = stock_map.get(pid, [])
                total = sum(s["quantity"] for s in stock_locs)
                resultado.append({
                    "id": pid,
                    "nombre": p.get("name", ""),
                    "codigo_interno": p.get("default_code") or "",
                    "barcode": p.get("barcode") or "",
                    "stock_por_ubicacion": stock_locs,
                    "total_stock": total,
                })

            # Ordenar: mayor stock primero
            resultado.sort(key=lambda x: x["total_stock"], reverse=True)
            return resultado

        except Exception as e:
            logger.error("Error obteniendo productos por categoría: %s", e)
            return []
