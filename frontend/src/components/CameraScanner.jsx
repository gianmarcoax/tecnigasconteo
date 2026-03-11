import { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export default function CameraScanner({ onScan, onClose }) {
    const scannerRef = useRef(null);
    const html5QrCode = useRef(null);
    const [cargando, setCargando] = useState(true);
    const [errorCamara, setErrorCamara] = useState(null);

    // Linterna y Zoom
    const [linternaSoportada, setLinternaSoportada] = useState(false);
    const [linternaActiva, setLinternaActiva] = useState(false);

    const [zoomSoportado, setZoomSoportado] = useState(false);
    const [zoomParams, setZoomParams] = useState({ min: 1, max: 1, step: 0.1, current: 1 });

    // Solo un escaneo por vez, para evitar múltiples triggers
    const alEscanear = useCallback((textoDecodificado) => {
        if (html5QrCode.current && textoDecodificado) {
            html5QrCode.current.pause(true); // Pausar rápido tras leer
            onScan(textoDecodificado);
            setTimeout(() => {
                onClose(); // Cerrar cámara después de leer con éxito
            }, 300);
        }
    }, [onScan, onClose]);

    useEffect(() => {
        // Inicializar
        html5QrCode.current = new Html5Qrcode("reader-camara");

        const config = {
            fps: 10,
            qrbox: { width: 250, height: 150 }, // Rectángulo estilo código de barras
            aspectRatio: 1.0,
            disableFlip: false,
        };

        html5QrCode.current.start(
            { facingMode: "environment" },
            config,
            (texto) => {
                alEscanear(texto);
            },
            () => {
                // Errores iterativos
            }
        ).then(() => {
            setCargando(false);

            // Verificar capabilities de la cámara
            const track = html5QrCode.current.getRunningTrackCameraCapabilities();
            if (track) {
                // Habilitar linterna
                if (track.torchFeature && track.torchFeature().isSupported()) {
                    setLinternaSoportada(true);
                }

                // Habilitar zoom
                if (track.zoomFeature && track.zoomFeature().isSupported()) {
                    setZoomSoportado(true);
                    setZoomParams({
                        min: track.zoomFeature().min() || 1,
                        max: track.zoomFeature().max() || 5,
                        step: track.zoomFeature().step() || 0.1,
                        current: track.zoomFeature().value() || 1
                    });
                }
            }
        }).catch(err => {
            setCargando(false);
            setErrorCamara("No se pudo iniciar la cámara. Verifica los permisos o que estés en HTTPS/localhost.");
            console.error("Error cámara:", err);
        });

        // Limpieza al desmontar
        return () => {
            if (html5QrCode.current?.isScanning) {
                html5QrCode.current.stop()
                    .then(() => html5QrCode.current.clear())
                    .catch(e => console.error("Error deteniendo cámara:", e));
            }
        };
    }, [alEscanear]);

    // Manejar Linterna
    const toggleLinterna = async () => {
        if (!html5QrCode.current || !linternaSoportada) return;

        try {
            const newState = !linternaActiva;
            await html5QrCode.current.applyVideoConstraints({
                advanced: [{ torch: newState }]
            });
            setLinternaActiva(newState);
        } catch (e) {
            console.error("Error alternando linterna:", e);
        }
    };

    // Manejar Zoom
    const cambiarZoom = async (e) => {
        const nuevoZoom = parseFloat(e.target.value);
        setZoomParams(prev => ({ ...prev, current: nuevoZoom }));

        if (html5QrCode.current && zoomSoportado) {
            try {
                await html5QrCode.current.applyVideoConstraints({
                    advanced: [{ zoom: nuevoZoom }]
                });
            } catch (err) {
                console.error("Error aplicando zoom:", err);
            }
        }
    };

    return (
        <div className="fixed inset-0 z-[9999] flex flex-col animar-entrada"
            style={{ background: '#000' }}>

            {/* Cabecera */}
            <div className="flex items-center justify-between p-4 bg-black/50 absolute top-0 left-0 right-0 z-10 backdrop-blur-sm">
                <button
                    onClick={onClose}
                    className="p-2 rounded-full cursor-pointer text-white hover:bg-white/20 transition-colors"
                >
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                <div className="text-white font-bold tracking-widest text-sm">ESCÁNER</div>

                {/* Botón linterna (solo se muestra si es soportada) */}
                <button
                    onClick={toggleLinterna}
                    className={`p-2 rounded-full cursor-pointer transition-colors ${linternaSoportada ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                    style={{ color: linternaActiva ? '#fbbf24' : '#fff', backgroundColor: linternaActiva ? 'rgba(251, 191, 36, 0.2)' : 'transparent' }}
                >
                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                </button>
            </div>

            {/* Contenedor del Lector */}
            <div className="flex-1 w-full h-full relative flex items-center justify-center">
                {cargando && !errorCamara && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-0">
                        <svg className="animate-spin w-12 h-12 mb-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="font-medium animate-pulse">Iniciando cámara...</p>
                    </div>
                )}

                {errorCamara && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6 text-center z-0">
                        <svg className="w-16 h-16 text-red-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <p className="font-bold text-lg mb-2">Error de Cámara</p>
                        <p className="text-sm opacity-80">{errorCamara}</p>
                    </div>
                )}

                {/* El div donde html5-qrcode inyecta el video */}
                <div id="reader-camara" ref={scannerRef} className="w-full max-w-lg overflow-hidden flex items-center" style={{ minHeight: '300px' }}></div>
            </div>

            {/* Pie / Controles Inferiores */}
            <div className="absolute bottom-0 left-0 right-0 p-6 flex flex-col items-center gap-4 bg-gradient-to-t from-black via-black/80 to-transparent z-10">

                {/* Control de Zoom */}
                {zoomSoportado && (
                    <div className="w-full max-w-xs flex items-center gap-3 bg-black/40 p-3 rounded-2xl backdrop-blur-md border border-white/10">
                        <svg className="w-5 h-5 text-white/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                        </svg>
                        <input
                            type="range"
                            min={zoomParams.min}
                            max={zoomParams.max}
                            step={zoomParams.step}
                            value={zoomParams.current}
                            onChange={cambiarZoom}
                            className="w-full h-2 bg-white/20 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                        <span className="text-white font-mono text-xs w-8 text-right">
                            {zoomParams.current.toFixed(1)}x
                        </span>
                    </div>
                )}

                <p className="text-white/80 font-medium text-sm drop-shadow-md text-center max-w-sm">
                    Alinea el código de barras dentro del recuadro para escanear
                </p>
            </div>

            <style>{`
                /* Ocultar UI fea por defecto de html5-qrcode */
                #reader-camara__dashboard_section_csr span { display: none !important; }
                #reader-camara__dashboard_section_csr button { display: none !important; }
                #reader-camara__dashboard_section_swaplink { display: none !important; }
                #qr-shaded-region { border-width: 60px 40px !important; } /* Margen del hueco de escaneo */
            `}</style>
        </div>
    );
}
