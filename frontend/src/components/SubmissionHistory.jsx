/**
 * SubmissionHistory – Historial persistente de envíos a Odoo.
 * Se guarda en localStorage clave 'historial_envios'.
 * Cada entrada: { id, timestamp, ubicacion, items[], totalProductos, totalUnidades }
 */
import { useState } from 'react';

const STORAGE_KEY = 'historial_envios';
const MAX_ENTRIES = 30;

export function guardarEnvio({ ubicacion, items }) {
    try {
        const existente = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        const nuevo = {
            id: Date.now(),
            timestamp: Date.now(),
            ubicacion,
            items: items.map(i => ({
                nombre: i.nombre,
                codigo_barras: i.codigo_barras,
                cantidad: i.cantidad,
                precio: i.precio || 0,
            })),
            totalProductos: items.length,
            totalUnidades: items.reduce((s, i) => s + i.cantidad, 0),
        };
        const actualizado = [nuevo, ...existente].slice(0, MAX_ENTRIES);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(actualizado));
    } catch (e) {
        console.error('Error guardando historial:', e);
    }
}

export function cargarHistorial() {
    try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    } catch {
        return [];
    }
}

function formatearFecha(ts) {
    const d = new Date(ts);
    return d.toLocaleString('es-PE', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    });
}

export default function SubmissionHistory({ onClose }) {
    const [historial] = useState(() => cargarHistorial());
    const [expandido, setExpandido] = useState(null);
    const [confirmLimpiar, setConfirmLimpiar] = useState(false);
    const [lista, setLista] = useState(historial);

    const limpiarTodo = () => {
        localStorage.removeItem(STORAGE_KEY);
        setLista([]);
        setConfirmLimpiar(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
            <div className="w-full max-w-2xl rounded-2xl overflow-hidden flex flex-col"
                style={{
                    background: 'var(--color-superficie)',
                    border: '1px solid var(--color-borde)',
                    maxHeight: '90vh',
                    boxShadow: '0 24px 64px rgba(0,0,0,0.4)',
                }}>

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4"
                    style={{ borderBottom: '1px solid var(--color-borde)' }}>
                    <div className="flex items-center gap-3">
                        <svg className="w-5 h-5" style={{ color: 'var(--color-primario)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        <div>
                            <h2 className="font-bold text-base" style={{ color: 'var(--color-texto)' }}>
                                Historial de Envíos a Odoo
                            </h2>
                            <p className="text-xs" style={{ color: 'var(--color-texto-secundario)' }}>
                                {lista.length === 0 ? 'Sin envíos registrados' : `${lista.length} envíos guardados`}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {lista.length > 0 && !confirmLimpiar && (
                            <button
                                type="button"
                                onClick={() => setConfirmLimpiar(true)}
                                className="text-xs px-3 py-1.5 rounded-xl transition-all active:scale-90"
                                style={{ background: 'var(--color-fondo)', color: 'var(--color-texto-secundario)', border: '1px solid var(--color-borde)' }}
                            >
                                Limpiar todo
                            </button>
                        )}
                        {confirmLimpiar && (
                            <div className="flex items-center gap-2">
                                <span className="text-xs" style={{ color: 'var(--color-texto-secundario)' }}>¿Seguro?</span>
                                <button onClick={limpiarTodo}
                                    className="text-xs px-3 py-1.5 rounded-xl font-bold"
                                    style={{ background: 'var(--color-peligro)', color: '#fff' }}>Sí</button>
                                <button onClick={() => setConfirmLimpiar(false)}
                                    className="text-xs px-3 py-1.5 rounded-xl"
                                    style={{ background: 'var(--color-fondo)', color: 'var(--color-texto-secundario)', border: '1px solid var(--color-borde)' }}>No</button>
                            </div>
                        )}
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center rounded-xl transition-all active:scale-90"
                            style={{ background: 'var(--color-fondo)', color: 'var(--color-texto-secundario)' }}
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* Lista de envíos */}
                <div className="overflow-y-auto flex-1">
                    {lista.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-3">
                            <svg className="w-12 h-12 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            <p className="text-sm" style={{ color: 'var(--color-texto-secundario)' }}>
                                Aún no hay envíos registrados. El historial se guarda automáticamente después de cada envío exitoso a Odoo.
                            </p>
                        </div>
                    ) : (
                        lista.map((envio) => {
                            const abierto = expandido === envio.id;
                            return (
                                <div key={envio.id} style={{ borderBottom: '1px solid var(--color-borde)' }}>
                                    {/* Cabecera del envío */}
                                    <button
                                        type="button"
                                        onClick={() => setExpandido(abierto ? null : envio.id)}
                                        className="w-full flex items-center gap-3 px-5 py-3.5 text-left transition-all"
                                        style={{ background: abierto ? 'var(--color-fondo)' : 'transparent' }}
                                    >
                                        {/* Ícono ubicación */}
                                        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                                            style={{ background: 'var(--color-primario)', color: '#fff' }}>
                                            {envio.ubicacion === 'almacen' ? '🏭' : '🏪'}
                                        </div>
                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className="font-semibold text-sm capitalize" style={{ color: 'var(--color-texto)' }}>
                                                    {envio.ubicacion === 'almacen' ? 'Almacén' : 'Tienda'}
                                                </span>
                                                <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                                                    style={{ background: 'var(--color-exito)', color: '#fff' }}>
                                                    {envio.totalProductos} prod · {envio.totalUnidades} ud.
                                                </span>
                                            </div>
                                            <div className="text-xs mt-0.5 font-mono" style={{ color: 'var(--color-texto-secundario)' }}>
                                                {formatearFecha(envio.timestamp)}
                                            </div>
                                        </div>
                                        <svg className={`w-4 h-4 flex-shrink-0 transition-transform ${abierto ? 'rotate-180' : ''}`}
                                            style={{ color: 'var(--color-texto-secundario)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>

                                    {/* Detalle */}
                                    {abierto && (
                                        <div className="px-5 pb-4 space-y-1.5">
                                            {/* Cabecera de columnas */}
                                            <div className="grid gap-2 px-3 py-1 text-xs font-semibold"
                                                style={{ color: 'var(--color-texto-secundario)', gridTemplateColumns: '1fr 80px 70px 50px' }}>
                                                <span>Producto</span>
                                                <span className="text-right">Código</span>
                                                <span className="text-right">Precio</span>
                                                <span className="text-center">Cant.</span>
                                            </div>
                                            {envio.items.map((item, i) => (
                                                <div key={i}
                                                    className="grid gap-2 items-center px-3 py-2 rounded-xl text-sm"
                                                    style={{
                                                        background: 'var(--color-fondo)',
                                                        gridTemplateColumns: '1fr 80px 70px 50px',
                                                    }}>
                                                    <span className="truncate font-medium" style={{ color: 'var(--color-texto)' }}>
                                                        {item.nombre}
                                                    </span>
                                                    <span className="text-right font-mono text-xs truncate" style={{ color: 'var(--color-texto-secundario)' }}>
                                                        {item.codigo_barras}
                                                    </span>
                                                    <span className="text-right text-xs font-medium" style={{ color: 'var(--color-exito)' }}>
                                                        S/ {(item.precio || 0).toFixed(2)}
                                                    </span>
                                                    <span className="text-center font-bold text-sm"
                                                        style={{ color: 'var(--color-primario)' }}>
                                                        {item.cantidad}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
