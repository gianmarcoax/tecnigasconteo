import { useState, useEffect, useRef } from 'react';

/**
 * SwipeableAlert – Notificación tipo toast que flota en la parte superior.
 * Permite descartar deslizando hacia arriba o hacia la derecha.
 */
export default function SwipeableAlert({ alerta, colapsarObj, onClose }) {
    const [cerrando, setCerrando] = useState(false);
    const touchStartY = useRef(null);
    const touchStartX = useRef(null);

    // Efecto de auto-cierre con timer
    useEffect(() => {
        if (!alerta) return;
        setCerrando(false);
        const timer = setTimeout(() => {
            iniciarCierre();
        }, alerta.duracion || 3000);
        return () => clearTimeout(timer);
    }, [alerta]);

    const iniciarCierre = () => {
        setCerrando(true);
        setTimeout(onClose, 250); // Tiempo de la animación de salida
    };

    const handleTouchStart = (e) => {
        touchStartY.current = e.touches[0].clientY;
        touchStartX.current = e.touches[0].clientX;
    };

    const handleTouchEnd = (e) => {
        if (touchStartY.current === null || touchStartX.current === null) return;
        const deltaY = touchStartY.current - e.changedTouches[0].clientY;
        const deltaX = e.changedTouches[0].clientX - touchStartX.current;

        // Deslizó hacia arriba (> 30px) o hacia la derecha (> 30px)
        if (deltaY > 30 || deltaX > 30) {
            iniciarCierre();
        }
        touchStartY.current = null;
        touchStartX.current = null;
    };

    if (!alerta) return null;

    const IconoAlerta = () => {
        switch (alerta.tipo) {
            case 'exito':
                return <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />;
            case 'error':
            case 'advertencia':
                return <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />;
            default:
                return <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />;
        }
    };

    return (
        <div
            className="fixed top-2 sm:top-24 left-1/2 z-[100] px-4 w-full max-w-md pointer-events-auto"
            style={{
                transform: `translateX(-50%) ${cerrando ? 'translateY(-150%) opacity-0' : 'translateY(0) opacity-100'}`,
                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            onClick={iniciarCierre} // Click también cierra
        >
            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl shadow-2xl cursor-pointer"
                style={{
                    background: colapsarObj[alerta.tipo]?.bg || '#2563eb',
                    color: colapsarObj[alerta.tipo]?.text || '#fff',
                }}>
                <svg className="w-6 h-6 flex-shrink-0 opacity-80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <IconoAlerta />
                </svg>
                <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">
                        {alerta.mensaje}
                    </p>
                    <p className="text-[10px] opacity-70">
                        Desliza arriba o toca para ocultar
                    </p>
                </div>
            </div>
        </div>
    );
}
