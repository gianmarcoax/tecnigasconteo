/**
 * ScanHistory – Panel de historial de escaneos y cargas.
 * Agrupa los scans en "bloques" con timestamp.
 * Props:
 *   historial: Array<{ id, timestamp, tipo, items[] }>
 *   onClear: () => void
 */
import { useState } from 'react';

const TIPO_LABEL = {
    scan: { text: 'Escaneo', color: 'var(--color-primario)' },
    bulk: { text: 'Carga TCT', color: '#7c3aed' },
    csv: { text: 'CSV', color: '#0891b2' },
    inc: { text: '+1', color: 'var(--color-exito)' },
};

function formatear(ts) {
    const d = new Date(ts);
    return d.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}

export default function ScanHistory({ historial, onClear }) {
    const [abierto, setAbierto] = useState(false);
    const [expandido, setExpandido] = useState(null);

    if (historial.length === 0) return null;

    return (
        <div className="rounded-2xl overflow-hidden"
            style={{ border: '1px solid var(--color-borde)', background: 'var(--color-superficie)' }}>

            {/* Header del panel */}
            <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setAbierto(v => !v)}
                className="w-full flex items-center justify-between px-4 py-3 transition-all"
                style={{ background: 'var(--color-superficie)' }}
            >
                <div className="flex items-center gap-2">
                    {/* Ícono historial */}
                    <svg className="w-4 h-4" style={{ color: 'var(--color-primario)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-semibold text-sm" style={{ color: 'var(--color-texto)' }}>
                        Historial de esta sesión
                    </span>
                    <span className="text-xs px-2 py-0.5 rounded-full font-bold"
                        style={{ background: 'var(--color-primario)', color: '#fff' }}>
                        {historial.length} bloques
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        type="button"
                        onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        onClick={(e) => { e.stopPropagation(); onClear(); }}
                        className="text-xs px-2 py-1 rounded-lg transition-all active:scale-90"
                        style={{ background: 'var(--color-fondo)', color: 'var(--color-texto-secundario)', border: '1px solid var(--color-borde)' }}
                    >
                        Limpiar
                    </button>
                    <svg className={`w-4 h-4 transition-transform ${abierto ? 'rotate-180' : ''}`}
                        style={{ color: 'var(--color-texto-secundario)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
            </button>

            {/* Contenido */}
            {abierto && (
                <div className="border-t" style={{ borderColor: 'var(--color-borde)', maxHeight: '420px', overflowY: 'auto' }}>
                    {historial.map((bloque) => {
                        const { text: tipoText, color: tipoColor } = TIPO_LABEL[bloque.tipo] || TIPO_LABEL.scan;
                        const estaExpandido = expandido === bloque.id;

                        return (
                            <div key={bloque.id}
                                className="border-b"
                                style={{ borderColor: 'var(--color-borde)' }}>

                                {/* Cabecera del bloque */}
                                <button
                                    type="button"
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => setExpandido(estaExpandido ? null : bloque.id)}
                                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all"
                                    style={{ background: estaExpandido ? 'var(--color-fondo)' : 'transparent' }}
                                >
                                    {/* Badge tipo */}
                                    <span className="flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-bold"
                                        style={{ background: tipoColor, color: '#fff', minWidth: '60px', textAlign: 'center' }}>
                                        {tipoText}
                                    </span>

                                    {/* Resumen */}
                                    <span className="flex-1 text-sm font-medium truncate"
                                        style={{ color: 'var(--color-texto)' }}>
                                        {bloque.items.length === 1
                                            ? bloque.items[0].nombre
                                            : `${bloque.items.length} productos`}
                                    </span>

                                    {/* Cantidad total del bloque */}
                                    <span className="flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-lg"
                                        style={{ background: 'var(--color-fondo)', color: 'var(--color-texto-secundario)' }}>
                                        +{bloque.items.reduce((s, i) => s + (i.cantidad || 1), 0)} ud.
                                    </span>

                                    {/* Hora */}
                                    <span className="flex-shrink-0 text-xs font-mono"
                                        style={{ color: 'var(--color-texto-secundario)' }}>
                                        {formatear(bloque.timestamp)}
                                    </span>

                                    <svg className={`flex-shrink-0 w-3.5 h-3.5 transition-transform ${estaExpandido ? 'rotate-180' : ''}`}
                                        style={{ color: 'var(--color-texto-secundario)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {/* Detalle del bloque */}
                                {estaExpandido && (
                                    <div className="px-4 pb-3 space-y-1.5">
                                        {bloque.items.map((item, i) => (
                                            <div key={i}
                                                className="flex items-center gap-3 px-3 py-2 rounded-xl"
                                                style={{ background: 'var(--color-fondo)' }}>
                                                {/* Número */}
                                                <span className="text-xs font-mono w-5 text-center flex-shrink-0"
                                                    style={{ color: 'var(--color-texto-secundario)' }}>{i + 1}</span>
                                                {/* Nombre */}
                                                <span className="flex-1 text-sm font-medium truncate"
                                                    style={{ color: 'var(--color-texto)' }}>{item.nombre}</span>
                                                {/* Código */}
                                                <span className="flex-shrink-0 text-xs font-mono hidden sm:block"
                                                    style={{ color: 'var(--color-texto-secundario)' }}>{item.codigo_barras}</span>
                                                {/* Precio */}
                                                {item.precio > 0 && (
                                                    <span className="flex-shrink-0 text-xs font-medium"
                                                        style={{ color: 'var(--color-exito)' }}>
                                                        S/ {item.precio.toFixed(2)}
                                                    </span>
                                                )}
                                                {/* Cantidad */}
                                                <span className="flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-lg"
                                                    style={{ background: tipoColor, color: '#fff' }}>
                                                    +{item.cantidad || 1}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
