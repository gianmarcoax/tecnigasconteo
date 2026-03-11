/**
 * Componente de entrada de código de barras.
 * SOLO mantiene el foco si el elemento activo es el body
 * (no roba el foco de botones, inputs ni selects).
 * CameraScanner se carga de forma diferida (lazy) para no ralentizar la carga inicial.
 */
import { useRef, useEffect, useCallback, useState, lazy, Suspense } from 'react';

// Carga diferida: html5-qrcode solo se descarga cuando el usuario abre la cámara
const CameraScanner = lazy(() => import('./CameraScanner'));

// Elementos interactivos donde NO debe robarse el foco
const TAGS_INTERACTIVOS = new Set(['INPUT', 'BUTTON', 'SELECT', 'TEXTAREA', 'A']);

export default function BarcodeInput({ onScan, disabled }) {
    const inputRef = useRef(null);
    const [mostrarCamara, setMostrarCamara] = useState(false);
    const [presionado, setPresionado] = useState(false);

    // Solo recuperar el foco si no hay ningún otro elemento interactivo activo
    useEffect(() => {
        if (disabled || mostrarCamara) return;
        const mantenerFoco = () => {
            const activo = document.activeElement;
            // NO robar foco si otro input/botón/select está activo
            if (activo && TAGS_INTERACTIVOS.has(activo.tagName) && activo !== inputRef.current) return;
            if (inputRef.current) {
                inputRef.current.focus({ preventScroll: true });
            }
        };
        mantenerFoco();
        const intervalo = setInterval(mantenerFoco, 800);
        return () => clearInterval(intervalo);
    }, [disabled, mostrarCamara]);

    const manejarSubmit = useCallback((e) => {
        e.preventDefault();
        const valor = inputRef.current?.value?.trim();
        if (valor && !disabled) {
            setPresionado(true);
            setTimeout(() => setPresionado(false), 200);
            onScan(valor);
            inputRef.current.value = '';
        }
    }, [onScan, disabled]);

    const alCerrarCamara = useCallback(() => {
        setMostrarCamara(false);
        setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 200);
    }, []);

    const alEscanearCamara = useCallback((codigo) => {
        onScan(codigo);
        setMostrarCamara(false);
    }, [onScan]);

    return (
        <div className="relative">
            <form
                onSubmit={manejarSubmit}
                className="flex items-center gap-2 p-3 rounded-2xl"
                style={{
                    background: 'var(--color-superficie)',
                    border: '2px solid var(--color-primario)',
                    boxShadow: '0 0 0 4px rgba(37, 99, 235, .12)',
                }}
            >
                {/* Campo de texto – acepta todo tipo de caracteres */}
                <input
                    ref={inputRef}
                    type="text"
                    id="barcode-input"
                    inputMode="none" // Evita que se abra el teclado virtual en móviles
                    disabled={disabled || mostrarCamara}
                    placeholder="Código de barras..."
                    autoComplete="off"
                    autoFocus
                    className="flex-1 text-base sm:text-lg font-medium outline-none bg-transparent px-2"
                    style={{ color: 'var(--color-texto)', minWidth: 0 }}
                />

                {/* Indicador activo – solo desktop */}
                <span className="hidden sm:flex items-center gap-1.5 mr-1">
                    <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                            style={{ backgroundColor: disabled ? 'var(--color-texto-secundario)' : 'var(--color-exito)' }} />
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5"
                            style={{ backgroundColor: disabled ? 'var(--color-texto-secundario)' : 'var(--color-exito)' }} />
                    </span>
                    <span className="text-xs font-medium" style={{ color: 'var(--color-texto-secundario)' }}>
                        {disabled ? 'Espera' : 'Listo'}
                    </span>
                </span>

                {/* Botón Cámara */}
                <button
                    type="button"
                    onClick={() => setMostrarCamara(true)}
                    onMouseDown={(e) => e.preventDefault()} // Evita que el click robe el foco
                    disabled={disabled}
                    className="flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-xl transition-all active:scale-90 disabled:opacity-40 cursor-pointer"
                    style={{ background: 'rgba(37,99,235,.1)', color: 'var(--color-primario)' }}
                    title="Escanear con la cámara"
                    aria-label="Abrir escáner de cámara"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </button>

                {/* Botón Buscar */}
                <button
                    type="submit"
                    onMouseDown={(e) => e.preventDefault()} // Evita que el click robe el foco
                    disabled={disabled}
                    className="flex-shrink-0 flex items-center justify-center h-11 px-4 rounded-xl font-bold text-white transition-all active:scale-90 disabled:opacity-40 cursor-pointer"
                    style={{
                        background: presionado ? 'var(--color-exito)' : 'var(--color-primario)',
                        transition: 'background 0.15s ease',
                        minWidth: '72px',
                    }}
                >
                    Buscar
                </button>
            </form>

            {/* Modal cámara – carga diferida */}
            {mostrarCamara && (
                <Suspense fallback={
                    <div className="fixed inset-0 z-50 flex items-center justify-center"
                        style={{ background: 'rgba(0,0,0,0.85)' }}>
                        <div className="flex flex-col items-center gap-3 text-white">
                            <svg className="animate-spin w-10 h-10" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            <p className="text-sm font-medium">Iniciando cámara...</p>
                        </div>
                    </div>
                }>
                    <CameraScanner
                        onScan={alEscanearCamara}
                        onClose={alCerrarCamara}
                    />
                </Suspense>
            )}
        </div>
    );
}
