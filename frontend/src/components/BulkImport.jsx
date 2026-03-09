/**
 * BulkImport – Editor de texto para carga masiva (TCT).
 * Formato: "codigo - cantidad" o "codigo cantidad" (espacio cualquiera).
 * Líneas con letras → comentarios (se ignoran).
 * Códigos repetidos → cantidades acumuladas (se advierte).
 */
import { useState, useRef, useEffect, useMemo } from 'react';

function parsearTexto(texto) {
    const mapa = new Map();        // codigo → cantidad final
    const duplicados = new Set();  // codigos que aparecen >1 vez
    const sinCantidad = [];        // lineas con solo 1 token numerico
    const conteos = new Map();     // para detectar duplicados

    for (const linea of texto.split(/\r?\n/)) {
        const t = linea.trim();
        if (!t) continue;
        if (/[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]/.test(t)) continue; // comentario

        const tokens = t.match(/\d+/g);
        if (!tokens || tokens.length === 0) continue;

        const codigo = tokens[0];
        const cantidad = tokens.length >= 2 ? parseInt(tokens[1], 10) : 1;

        if (tokens.length === 1) sinCantidad.push(codigo);

        // Detectar duplicados
        conteos.set(codigo, (conteos.get(codigo) || 0) + 1);
        if (conteos.get(codigo) > 1) duplicados.add(codigo);

        mapa.set(codigo, (mapa.get(codigo) || 0) + (isNaN(cantidad) ? 1 : Math.max(1, cantidad)));
    }

    return { mapa, duplicados, sinCantidad };
}

export default function BulkImport({ onImport, onClose }) {
    const [texto, setTexto] = useState('');
    const [cargando, setCargando] = useState(false);
    const [progreso, setProgreso] = useState({ actual: 0, total: 0 });
    const [resultado, setResultado] = useState(null); // { noEncontrados, agregados }
    const textareaRef = useRef(null);

    useEffect(() => { textareaRef.current?.focus(); }, []);

    const { mapa, duplicados, sinCantidad } = useMemo(() => parsearTexto(texto), [texto]);
    const totalCodigos = mapa.size;
    const totalUnidades = Array.from(mapa.values()).reduce((a, b) => a + b, 0);

    const manejarImportar = async () => {
        if (mapa.size === 0) return;
        setCargando(true);
        setResultado(null);
        setProgreso({ actual: 0, total: mapa.size });

        const res = await onImport(mapa, (n) => setProgreso((p) => ({ ...p, actual: n })));

        setCargando(false);
        // Si hay no encontrados, mostrar panel; si todo ok, cerrar
        if (res?.noEncontrados?.length > 0) {
            setResultado(res);
        } else {
            onClose();
        }
    };

    const pct = progreso.total > 0 ? Math.round((progreso.actual / progreso.total) * 100) : 0;
    const lineas = texto.split(/\r?\n/);

    // Advertencias en tiempo real (antes de importar)
    const advertencias = [];
    if (duplicados.size > 0)
        advertencias.push(`${duplicados.size} código(s) duplicado(s): se sumarán sus cantidades`);
    if (sinCantidad.length > 0)
        advertencias.push(`${sinCantidad.length} línea(s) sin cantidad explícita: se usará 1`);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,.6)', backdropFilter: 'blur(6px)' }}
            onClick={(e) => { if (!cargando && e.target === e.currentTarget) onClose(); }}
        >
            <div
                className="w-full max-w-lg flex flex-col rounded-2xl shadow-2xl"
                style={{
                    background: 'var(--color-superficie)',
                    border: '1px solid var(--color-borde)',
                    maxHeight: '90vh',
                }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4"
                    style={{ borderBottom: '1px solid var(--color-borde)' }}>
                    <div>
                        <h2 className="font-bold text-base" style={{ color: 'var(--color-texto)' }}>
                            Carga Masiva · TCT
                        </h2>
                        <p className="text-xs mt-0.5" style={{ color: 'var(--color-texto-secundario)' }}>
                            Un código por línea · Líneas con letras = comentarios
                        </p>
                    </div>
                    {!cargando && (
                        <button onClick={onClose}
                            className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer text-lg transition-all hover:scale-110"
                            style={{ background: 'var(--color-fondo)', color: 'var(--color-texto)' }}>
                            ✕
                        </button>
                    )}
                </div>

                {/* PANEL RESULTADO (post-importar) */}
                {resultado && (
                    <div className="mx-5 mt-4 rounded-xl overflow-hidden text-sm"
                        style={{ border: '1px solid var(--color-borde)' }}>
                        <div className="px-4 py-2 font-semibold flex items-center gap-2"
                            style={{ background: '#d97706', color: '#fff' }}>
                            ⚠ {resultado.noEncontrados.length} código(s) no encontrado(s) en Odoo
                        </div>
                        <div className="divide-y overflow-y-auto" style={{ maxHeight: '120px' }}>
                            {resultado.noEncontrados.map((cod) => (
                                <div key={cod} className="px-4 py-1.5 font-mono text-xs flex justify-between"
                                    style={{ color: 'var(--color-texto)' }}>
                                    <span>{cod}</span>
                                    <span style={{ color: '#dc2626' }}>No encontrado</span>
                                </div>
                            ))}
                        </div>
                        <div className="px-4 py-2 text-xs flex justify-between"
                            style={{ background: 'var(--color-fondo)', color: 'var(--color-texto-secundario)' }}>
                            <span>✓ {resultado.agregados} productos importados correctamente</span>
                            <button onClick={onClose}
                                className="underline cursor-pointer"
                                style={{ color: 'var(--color-primario)' }}>
                                Cerrar
                            </button>
                        </div>
                    </div>
                )}

                {/* EDITOR */}
                {!resultado && (
                    <div className="flex-1 overflow-hidden px-5 pt-4 pb-1" style={{ minHeight: 0 }}>
                        <div className="flex rounded-xl overflow-hidden text-sm font-mono"
                            style={{
                                background: 'var(--color-fondo)',
                                border: '1px solid var(--color-borde)',
                                minHeight: '240px',
                                maxHeight: '340px',
                            }}>
                            {/* Números de línea */}
                            <div className="select-none text-right overflow-hidden py-3 px-2"
                                style={{
                                    color: 'var(--color-texto-secundario)',
                                    borderRight: '1px solid var(--color-borde)',
                                    minWidth: '2.8rem',
                                    lineHeight: '1.6',
                                    fontSize: '0.72rem',
                                }}>
                                {lineas.map((_, i) => <div key={i}>{i + 1}</div>)}
                            </div>
                            <textarea
                                ref={textareaRef}
                                value={texto}
                                onChange={(e) => { setTexto(e.target.value); setResultado(null); }}
                                disabled={cargando}
                                className="flex-1 resize-none outline-none py-3 px-3"
                                style={{
                                    background: 'transparent',
                                    color: 'var(--color-texto)',
                                    lineHeight: '1.6',
                                    fontSize: '0.875rem',
                                }}
                                placeholder={'0016040 - 2\n001316 - 1\n# comentario ignorado\n0016095   1'}
                                spellCheck={false}
                            />
                        </div>
                    </div>
                )}

                {/* Advertencias en tiempo real */}
                {!resultado && advertencias.length > 0 && (
                    <div className="mx-5 mt-2 rounded-lg px-3 py-2 space-y-0.5"
                        style={{ background: 'rgba(217,119,6,.08)', border: '1px solid rgba(217,119,6,.3)' }}>
                        {advertencias.map((a, i) => (
                            <p key={i} className="text-xs flex gap-1.5 items-start"
                                style={{ color: '#d97706' }}>
                                <span>⚠</span><span>{a}</span>
                            </p>
                        ))}
                    </div>
                )}

                {/* Stats live */}
                {!resultado && (
                    <div className="px-5 py-2 flex gap-4 text-xs"
                        style={{ color: 'var(--color-texto-secundario)' }}>
                        <span><b style={{ color: 'var(--color-primario)' }}>{totalCodigos}</b> códigos únicos</span>
                        <span><b style={{ color: 'var(--color-exito)' }}>{totalUnidades}</b> unidades</span>
                    </div>
                )}

                {/* Progress bar */}
                {cargando && (
                    <div className="px-5 pb-2">
                        <div className="flex justify-between text-xs mb-1"
                            style={{ color: 'var(--color-texto-secundario)' }}>
                            <span>Importando... {progreso.actual}/{progreso.total}</span>
                            <span>{pct}%</span>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden"
                            style={{ background: 'var(--color-fondo)', border: '1px solid var(--color-borde)' }}>
                            <div className="h-full rounded-full transition-all duration-300"
                                style={{
                                    width: `${pct}%`,
                                    background: 'linear-gradient(90deg, var(--color-primario), var(--color-exito))',
                                }} />
                        </div>
                    </div>
                )}

                {/* Footer */}
                {!resultado && (
                    <div className="px-5 py-4 flex gap-3"
                        style={{ borderTop: '1px solid var(--color-borde)' }}>
                        {!cargando && (
                            <button onClick={onClose}
                                className="flex-1 py-2.5 rounded-xl font-medium text-sm cursor-pointer transition-all hover:scale-105 active:scale-95"
                                style={{
                                    background: 'var(--color-fondo)',
                                    border: '1px solid var(--color-borde)',
                                    color: 'var(--color-texto)',
                                }}>
                                Cancelar
                            </button>
                        )}
                        <button
                            onClick={manejarImportar}
                            disabled={cargando || totalCodigos === 0}
                            className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white cursor-pointer transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            style={{ background: 'linear-gradient(135deg, var(--color-primario), #1d4ed8)' }}
                        >
                            {cargando ? (
                                <>
                                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                    </svg>
                                    Importando...
                                </>
                            ) : (
                                `Importar ${totalCodigos > 0 ? `(${totalCodigos})` : ''}`
                            )}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
