/**
 * Cliente API – Comunicación con el backend FastAPI.
 */
import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    timeout: 15000,
    headers: { 'Content-Type': 'application/json' },
});

/**
 * Busca un producto por código de barras.
 * @param {string} codigoBarras
 * @returns {Promise<{encontrado: boolean, producto?: object, mensaje: string}>}
 */
export async function buscarProducto(codigoBarras) {
    const { data } = await api.get('/productos/buscar', {
        params: { codigo_barras: codigoBarras },
    });
    return data;
}

/**
 * Enviar el inventario contado a Odoo.
 * @param {string} ubicacion - 'almacen' o 'tienda'
 * @param {Array} items - [{id_odoo, cantidad}]
 */
export async function enviarInventario(ubicacion, items) {
    const { data } = await api.post('/inventario/enviar', {
        ubicacion,
        items
    }, { timeout: 60000 }); // Más tiempo por si son muchos
    return data;
}

/**
 * Obtener todos los productos con stock negativo
 */
export async function obtenerStockNegativo() {
    const { data } = await api.get('/inventario/negativos', { timeout: 60000 });
    return data;
}

/**
 * Obtiene las ubicaciones internas de Odoo.
 */
export async function obtenerUbicaciones() {
    const { data } = await api.get('/inventario/ubicaciones');
    return data.ubicaciones || [];
}

/**
 * Verifica el estado de salud del backend.
 */
export async function verificarSalud() {
    const { data } = await api.get('/inventario/salud');
    return data;
}

/**
 * Importar productos desde un archivo CSV.
 * @param {File} archivo
 */
export async function importarCSV(archivo) {
    const formData = new FormData();
    formData.append('archivo', archivo);
    const { data } = await api.post('/productos/importar-csv', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
}

/**
 * Exportar inventario contado a Excel.
 * @param {Array} items - Lista de productos contados
 */
export async function exportarExcel(items) {
    const { data } = await api.post('/productos/exportar-excel', items, {
        responseType: 'blob',
    });
    // Descargar el archivo
    const url = window.URL.createObjectURL(new Blob([data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'conteo_inventario.xlsx');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
}

/**
 * Obtener stock a la mano y último movimiento de un producto.
 * @param {number} idOdoo - ID del producto en Odoo
 */
export async function obtenerStock(idOdoo) {
    const { data } = await api.get('/productos/stock', {
        params: { id_odoo: idOdoo },
    });
    return data;
}

/**
 * Obtiene el stock a la mano de una lista de IDs de forma masiva (optimización).
 * @param {number[]} idsOdoo
 */
export async function obtenerStockMasivo(idsOdoo) {
    if (!idsOdoo || idsOdoo.length === 0) return {};
    const { data } = await api.post('/productos/stock-masivo', {
        ids_odoo: idsOdoo
    });
    return data.resultados || {};
}

export async function buscarGlobal(query) {
    const { data } = await api.get('/productos/buscar-global', {
        params: { q: query },
        timeout: 30000,
    });
    return data;
}

/**
 * Busca múltiples productos por sus códigos de barras de una sola vez.
 * @param {string[]} codigos
 */
export async function buscarMasivo(codigos) {
    if (!codigos || codigos.length === 0) return { exito: true, productos: [] };
    const { data } = await api.post('/productos/buscar-masivo', {
        codigos: codigos
    });
    return data;
}

/**
 * Obtener todas las categorías de productos de Odoo.
 */
export async function obtenerCategorias() {
    const { data } = await api.get('/productos/categorias', { timeout: 30000 });
    return data.categorias || [];
}

/**
 * Obtener productos de una categoría con su stock actual.
 * @param {number} categoriaId
 */
export async function obtenerPorCategoria(categoriaId) {
    const { data } = await api.get('/productos/por-categoria', {
        params: { categoria_id: categoriaId },
        timeout: 60000,
    });
    return data;
}

export default api;
