/**
 * Componente de entrada de código de barras.
 * Siempre mantiene el foco y captura la tecla ENTER para procesar el escaneo.
 */
import { useRef, useEffect, useCallback } from 'react';

export default function BarcodeInput({ onScan, disabled }) {
    const inputRef = useRef(null);

    // Mantener el foco siempre (solo cuando NO está deshabilitado)
    useEffect(() => {
        if (disabled) return; // no robar foco si hay un modal abierto
        const mantenerFoco = () => {
            if (inputRef.current && document.activeElement !== inputRef.current) {
                inputRef.current.focus();
            }
        };
        mantenerFoco();
        const intervalo = setInterval(mantenerFoco, 300);
        return () => clearInterval(intervalo);
    }, [disabled]);

    const manejarTecla = useCallback(
        (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const valor = inputRef.current?.value?.trim();
                if (valor && !disabled) {
                    onScan(valor);
                    inputRef.current.value = '';
                }
            }
        },
        [onScan, disabled]
    );

    return (
        <div className="relative">
            <div className="flex items-center gap-3 p-4 rounded-xl"
                style={{
                    background: 'var(--color-superficie)',
                    border: '2px solid var(--color-primario)',
                    boxShadow: '0 0 0 4px rgba(37, 99, 235, .1)',
                }}>
                {/* Icono escáner */}
                <div className="flex-shrink-0">
                    <svg className="w-6 h-6" style={{ color: 'var(--color-primario)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                </div>

                <input
                    ref={inputRef}
                    type="text"
                    id="barcode-input"
                    onKeyDown={manejarTecla}
                    disabled={disabled}
                    placeholder="Escanea un código de barras o escríbelo aquí..."
                    autoComplete="off"
                    autoFocus
                    className="flex-1 text-lg font-medium outline-none bg-transparent"
                    style={{ color: 'var(--color-texto)' }}
                />

                {/* Indicador de estado */}
                <div className="flex-shrink-0 flex items-center gap-2">
                    <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                            style={{ backgroundColor: disabled ? 'var(--color-texto-secundario)' : 'var(--color-exito)' }} />
                        <span className="relative inline-flex rounded-full h-3 w-3"
                            style={{ backgroundColor: disabled ? 'var(--color-texto-secundario)' : 'var(--color-exito)' }} />
                    </span>
                    <span className="text-sm font-medium" style={{ color: 'var(--color-texto-secundario)' }}>
                        {disabled ? 'Deshabilitado' : 'Listo'}
                    </span>
                </div>
            </div>
        </div>
    );
}
