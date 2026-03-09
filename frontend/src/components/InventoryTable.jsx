/**
 * Tabla de inventario en tiempo real.
 * Muestra productos escaneados con controles de cantidad y stock a la mano.
 */
import { useState } from 'react';

export default function InventoryTable({ items, onUpdateQty, onRemove }) {
    const [editandoId, setEditandoId] = useState(null);
    const [valorEdicion, setValorEdicion] = useState('');
    const [expandidoId, setExpandidoId] = useState(null);

    const iniciarEdicion = (codigoBarras, cantidadActual) => {
        setEditandoId(codigoBarras);
        setValorEdicion(String(cantidadActual));
    };

    const confirmarEdicion = (codigoBarras) => {
        const nuevaCantidad = parseInt(valorEdicion, 10);
        if (!isNaN(nuevaCantidad) && nuevaCantidad >= 0) {
            onUpdateQty(codigoBarras, nuevaCantidad);
        }
        setEditandoId(null);
    };

    const manejarTeclaEdicion = (e, codigoBarras) => {
        if (e.key === 'Enter') {
            e.stopPropagation();
            confirmarEdicion(codigoBarras);
        }
        if (e.key === 'Escape') {
            setEditandoId(null);
        }
    };

    /**
     * Formatea una fecha ISO a formato legible en español.
     */
    const formatearFecha = (fechaISO) => {
        if (!fechaISO) return '—';
        try {
            const fecha = new Date(fechaISO);
            return fecha.toLocaleString('es-PE', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return fechaISO;
        }
    };

    /** Clasifica ubicaciones en almacén y tienda */
    const clasificarStock = (stockPorUbicacion) => {
        if (!stockPorUbicacion || stockPorUbicacion.length === 0) return { almacen: null, tienda: null };
        let almacen = 0;
        let tienda = 0;
        let tieneAlmacen = false;
        let tieneTienda = false;
        for (const s of stockPorUbicacion) {
            const nombre = (s.location_name || '').toLowerCase();
            if (nombre.includes('tienda') || nombre.includes('shop') || nombre.includes('pos')) {
                tienda += s.quantity || 0;
                tieneTienda = true;
            } else {
                almacen += s.quantity || 0;
                tieneAlmacen = true;
            }
        }
        return {
            almacen: tieneAlmacen ? almacen : null,
            tienda: tieneTienda ? tienda : null,
            total: (tieneAlmacen ? almacen : 0) + (tieneTienda ? tienda : 0),
        };
    };

    if (items.length === 0) {
        return (
            <div className="text-center py-16 animar-entrada"
                style={{ color: 'var(--color-texto-secundario)' }}>
                <svg className="w-16 h-16 mx-auto mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <p className="text-xl font-semibold mb-2">Sin productos escaneados</p>
                <p className="text-sm">Escanea un código de barras para comenzar el conteo</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto rounded-xl"
            style={{ border: '1px solid var(--color-borde)' }}>
            <table className="w-full text-sm">
                <thead>
                    <tr style={{ background: 'var(--color-primario)', color: '#fff' }}>
                        <th className="text-left px-4 py-3 font-semibold">#</th>
                        <th className="text-left px-4 py-3 font-semibold">Código de Barras</th>
                        <th className="text-left px-4 py-3 font-semibold">Producto</th>
                        <th className="text-center px-4 py-3 font-semibold">Cantidad</th>
                        <th className="text-center px-4 py-3 font-semibold whitespace-nowrap">Stock Actual</th>
                        <th className="text-center px-4 py-3 font-semibold">Acciones</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, index) => {
                        const stock = clasificarStock(item.stock_por_ubicacion);
                        const expandido = expandidoId === item.codigo_barras;

                        return (
                            <tr key={item.codigo_barras}
                                className="animar-fila transition-colors duration-150"
                                style={{
                                    background: index % 2 === 0 ? 'var(--color-superficie)' : 'var(--color-fondo)',
                                    borderBottom: '1px solid var(--color-borde)',
                                }}>
                                <td className="px-4 py-3 font-mono text-xs" style={{ color: 'var(--color-texto-secundario)' }}>
                                    {index + 1}
                                </td>
                                <td className="px-4 py-3 font-mono font-medium" style={{ color: 'var(--color-texto)' }}>
                                    {item.codigo_barras}
                                </td>
                                <td className="px-4 py-3 font-medium" style={{ color: 'var(--color-texto)' }}>
                                    {item.nombre}
                                </td>
                                <td className="px-4 py-3 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                        {/* Botón decrementar */}
                                        <button
                                            onClick={() => onUpdateQty(item.codigo_barras, Math.max(0, item.cantidad - 1))}
                                            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white transition-all duration-150 hover:scale-110 active:scale-95 cursor-pointer"
                                            style={{ background: 'var(--color-peligro)' }}
                                            title="Disminuir cantidad"
                                        >
                                            −
                                        </button>

                                        {/* Cantidad editable */}
                                        {editandoId === item.codigo_barras ? (
                                            <input
                                                type="number"
                                                value={valorEdicion}
                                                onChange={(e) => setValorEdicion(e.target.value)}
                                                onBlur={() => confirmarEdicion(item.codigo_barras)}
                                                onKeyDown={(e) => manejarTeclaEdicion(e, item.codigo_barras)}
                                                className="w-16 text-center font-bold text-lg rounded-lg px-1 py-0.5 outline-none"
                                                style={{
                                                    background: 'var(--color-fondo)',
                                                    border: '2px solid var(--color-primario)',
                                                    color: 'var(--color-texto)',
                                                }}
                                                autoFocus
                                                min="0"
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                        ) : (
                                            <button
                                                onClick={() => iniciarEdicion(item.codigo_barras, item.cantidad)}
                                                className="w-16 text-center font-bold text-lg rounded-lg px-1 py-0.5 cursor-pointer transition-all hover:scale-105"
                                                style={{
                                                    background: 'var(--color-fondo)',
                                                    border: '1px solid var(--color-borde)',
                                                    color: 'var(--color-texto)',
                                                }}
                                                title="Clic para editar cantidad"
                                            >
                                                {item.cantidad}
                                            </button>
                                        )}

                                        {/* Botón incrementar */}
                                        <button
                                            onClick={() => onUpdateQty(item.codigo_barras, item.cantidad + 1)}
                                            className="w-8 h-8 rounded-lg flex items-center justify-center font-bold text-white transition-all duration-150 hover:scale-110 active:scale-95 cursor-pointer"
                                            style={{ background: 'var(--color-exito)' }}
                                            title="Aumentar cantidad"
                                        >
                                            +
                                        </button>
                                    </div>
                                </td>

                                {/* ============ STOCK ACTUAL (columna nueva) ============ */}
                                <td className="px-3 py-3 text-center">
                                    {item.stock_por_ubicacion ? (
                                        <div className="relative inline-block">
                                            <button
                                                onClick={() => setExpandidoId(expandido ? null : item.codigo_barras)}
                                                className="inline-flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg cursor-pointer transition-all hover:scale-105"
                                                style={{
                                                    background: 'var(--color-fondo)',
                                                    border: '1px solid var(--color-borde)',
                                                }}
                                                title="Ver detalle por ubicación"
                                            >
                                                {/* Mini badges de stock */}
                                                <div className="flex items-center gap-2 text-xs font-semibold">
                                                    {stock.almacen !== null && (
                                                        <span className="flex items-center gap-1">
                                                            <span style={{ color: 'var(--color-primario)' }}>ALM</span>
                                                            <span style={{ color: 'var(--color-texto)' }}>{stock.almacen}</span>
                                                        </span>
                                                    )}
                                                    {stock.almacen !== null && stock.tienda !== null && (
                                                        <span style={{ color: 'var(--color-borde)' }}>|</span>
                                                    )}
                                                    {stock.tienda !== null && (
                                                        <span className="flex items-center gap-1">
                                                            <span style={{ color: 'var(--color-exito)' }}>TDA</span>
                                                            <span style={{ color: 'var(--color-texto)' }}>{stock.tienda}</span>
                                                        </span>
                                                    )}
                                                    {stock.almacen === null && stock.tienda === null && (
                                                        <span style={{ color: 'var(--color-texto-secundario)' }}>0</span>
                                                    )}
                                                </div>
                                            </button>

                                            {/* Tooltip expandido con detalle */}
                                            {expandido && (
                                                <div className="absolute z-30 top-full left-1/2 -translate-x-1/2 mt-2 w-56 rounded-xl shadow-2xl p-3 animar-entrada"
                                                    style={{
                                                        background: 'var(--color-superficie)',
                                                        border: '1px solid var(--color-borde)',
                                                    }}>
                                                    <p className="text-xs font-bold mb-2" style={{ color: 'var(--color-texto)' }}>
                                                        Stock a la mano
                                                    </p>
                                                    {item.stock_por_ubicacion.map((s, i) => (
                                                        <div key={i} className="flex justify-between text-xs py-1"
                                                            style={{ borderBottom: '1px solid var(--color-borde)' }}>
                                                            <span style={{ color: 'var(--color-texto-secundario)' }}>
                                                                {s.location_name}
                                                            </span>
                                                            <span className="font-bold" style={{ color: 'var(--color-texto)' }}>
                                                                {s.quantity}
                                                            </span>
                                                        </div>
                                                    ))}
                                                    {item.ultimo_movimiento && (
                                                        <div className="mt-2 pt-1 text-xs" style={{ color: 'var(--color-texto-secundario)' }}>
                                                            <span className="font-semibold">Últ. movimiento:</span><br />
                                                            {formatearFecha(item.ultimo_movimiento)}
                                                        </div>
                                                    )}
                                                    {!item.ultimo_movimiento && (
                                                        <div className="mt-2 pt-1 text-xs" style={{ color: 'var(--color-texto-secundario)' }}>
                                                            Sin movimientos registrados
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <span className="text-xs italic" style={{ color: 'var(--color-texto-secundario)' }}>
                                            Cargando...
                                        </span>
                                    )}
                                </td>

                                <td className="px-4 py-3 text-center">
                                    <button
                                        onClick={() => onRemove(item.codigo_barras)}
                                        className="px-3 py-1.5 rounded-lg text-sm font-medium text-white transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer"
                                        style={{ background: 'var(--color-peligro)' }}
                                        title="Eliminar producto del conteo"
                                    >
                                        Eliminar
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
