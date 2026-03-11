/**
 * Tabla de inventario en tiempo real.
 * Muestra productos escaneados con controles de cantidad y stock a la mano.
 */
import { useState } from 'react';

export default function InventoryTable({ items, onUpdateQty, onRemove, onRefreshStock }) {
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
            // Odoo devuelve las fechas en UTC como "YYYY-MM-DD HH:MM:SS" (sin la Z final).
            // Reemplazamos el espacio por T y añadimos Z para forzar parsing UTC en JS.
            const fechaFormat = fechaISO.includes('Z') ? fechaISO : fechaISO.replace(' ', 'T') + 'Z';
            const fecha = new Date(fechaFormat);

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
                        <th className="text-left p-2 sm:px-3 sm:py-3 font-semibold">#</th>
                        <th className="text-left p-2 sm:px-3 sm:py-3 font-semibold hidden sm:table-cell">Código / Precio</th>
                        <th className="text-left p-2 sm:px-3 sm:py-3 font-semibold">Producto</th>
                        <th className="text-center p-2 sm:px-3 sm:py-3 font-semibold">Cant.</th>
                        <th className="text-center p-2 sm:px-3 sm:py-3 font-semibold whitespace-nowrap">ALM / TDA</th>
                        <th className="text-center p-2 sm:px-3 sm:py-3 font-semibold">Acc.</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, index) => {
                        const stock = clasificarStock(item.stock_por_ubicacion);
                        const expandido = expandidoId === item.codigo_barras;
                        const tieneNegativo = Array.isArray(item.stock_por_ubicacion) && item.stock_por_ubicacion.some(s => s.quantity < 0);

                        let bgStyle = index % 2 === 0 ? 'var(--color-superficie)' : 'var(--color-fondo)';
                        if (tieneNegativo) {
                            bgStyle = 'var(--color-error-fondo, #fef2f2)'; // Color rojo muy pálido para destacar
                        }

                        return (
                            <tr key={item.codigo_barras}
                                className={`animar-fila transition-colors duration-150 ${tieneNegativo ? 'dark:bg-red-900/20' : ''}`}
                                style={{
                                    background: tieneNegativo && !document.documentElement.classList.contains('dark') ? bgStyle : (document.documentElement.classList.contains('dark') && tieneNegativo) ? undefined : bgStyle,
                                    borderBottom: '1px solid var(--color-borde)',
                                    color: tieneNegativo ? 'var(--color-error)' : undefined
                                }}>
                                <td className="p-2 sm:px-3 sm:py-3 font-mono text-xs" style={{ color: 'var(--color-texto-secundario)' }}>
                                    {index + 1}
                                </td>
                                {/* En móvil: una sola celda con código + precio */}
                                <td className="p-2 sm:px-3 sm:py-3 hidden sm:table-cell" style={{ color: 'var(--color-texto)' }}>
                                    <div className="font-mono font-medium text-xs">{item.codigo_barras}</div>
                                    <div className="text-xs font-medium mt-0.5" style={{ color: 'var(--color-exito)' }}>S/ {item.precio?.toFixed(2) || '0.00'}</div>
                                </td>
                                <td className="p-2 sm:px-3 sm:py-3 font-medium text-xs sm:text-sm" style={{ color: 'var(--color-texto)' }}>
                                    <div className="leading-tight">
                                        <div className="break-words line-clamp-3">{item.nombre}</div>
                                        {/* Bajo el nombre en móvil: código y precio */}
                                        <div className="sm:hidden mt-1 flex flex-wrap gap-x-2 items-center">
                                            <span className="font-mono text-[10px]" style={{ color: 'var(--color-texto-secundario)' }}>{item.codigo_barras}</span>
                                            <span className="text-[10px] font-bold" style={{ color: 'var(--color-exito)' }}>S/ {item.precio?.toFixed(2) || '0'}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="p-1 sm:px-3 sm:py-3 text-center">
                                    <div className="flex items-center justify-center gap-1 sm:gap-2">
                                        {/* Botón decrementar */}
                                        <button
                                            onMouseDown={(e) => e.preventDefault()}
                                            onClick={() => onUpdateQty(item.codigo_barras, Math.max(0, item.cantidad - 1))}
                                            className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0 rounded-lg sm:rounded-xl flex items-center justify-center font-bold text-white text-base sm:text-lg transition-all duration-150 active:scale-90 cursor-pointer"
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
                                                className="w-12 sm:w-16 text-center font-bold text-base sm:text-lg rounded-lg py-1 outline-none"
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
                                                className="w-12 sm:w-16 flex-shrink-0 text-center font-bold text-base sm:text-lg rounded-lg py-1 cursor-pointer transition-all hover:scale-105"
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
                                            className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0 rounded-lg sm:rounded-xl flex items-center justify-center font-bold text-white text-base sm:text-lg transition-all duration-150 active:scale-90 cursor-pointer"
                                            style={{ background: 'var(--color-exito)' }}
                                            onMouseDown={(e) => e.preventDefault()}
                                            title="Aumentar cantidad"
                                        >
                                            +
                                        </button>
                                    </div>
                                </td>

                                {/* STOCK ALM / TDA – siempre visible */}
                                <td className="p-1 sm:px-3 sm:py-3 text-center">
                                    {item.stock_por_ubicacion ? (
                                        <div className="relative inline-block">
                                            <button
                                                onClick={() => setExpandidoId(expandido ? null : item.codigo_barras)}
                                                className="inline-flex flex-col items-center gap-0.5 px-2 py-1 sm:px-3 sm:py-1.5 rounded-lg cursor-pointer transition-all hover:scale-105"
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

                                <td className="p-1 sm:px-3 sm:py-3 text-center">
                                    <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2">
                                        <button
                                            onClick={() => onRefreshStock(item.codigo_barras)}
                                            className="p-1.5 sm:p-2 rounded-lg text-sm transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer"
                                            style={{
                                                background: 'var(--color-fondo)',
                                                border: '1px solid var(--color-borde)',
                                                color: 'var(--color-primario)'
                                            }}
                                            title="Actualizar stock de Odoo"
                                        >
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                            </svg>
                                        </button>
                                        <button
                                            onClick={() => onRemove(item.codigo_barras)}
                                            className="p-1.5 sm:px-3 sm:py-1.5 rounded-lg text-sm font-medium text-white transition-all duration-150 hover:scale-105 active:scale-95 cursor-pointer flex items-center justify-center gap-1"
                                            style={{ background: 'var(--color-peligro)' }}
                                            title="Eliminar producto"
                                        >
                                            <svg className="w-4 h-4 sm:w-4 sm:h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                            <span className="hidden sm:inline">Eliminar</span>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div >
    );
}
