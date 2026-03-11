/**
 * Página de selección de ubicación.
 * El usuario elige dónde va a realizar el conteo de inventario.
 */
import { useState } from 'react';
import SubmissionHistory from '../components/SubmissionHistory';

export default function LocationSelector({ onSelect, onVerStock, onVerNegativos }) {
    const [verHistorial, setVerHistorial] = useState(false);

    const ubicaciones = [
        {
            id: 'almacen',
            nombre: 'Almacén',
            descripcion: 'Conteo de inventario en el almacén principal',
            icono: (
                <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                        d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
                </svg>
            ),
        },
        {
            id: 'tienda',
            nombre: 'Tienda',
            descripcion: 'Conteo de inventario en el punto de venta',
            icono: (
                <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round"
                        d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                </svg>
            ),
        },
    ];

    return (
        <div className="min-h-screen flex items-center justify-center p-6"
            style={{ background: 'var(--color-fondo)' }}>
            <div className="w-full max-w-2xl animar-entrada">
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6"
                        style={{
                            background: 'linear-gradient(135deg, var(--color-primario), #7c3aed)',
                            boxShadow: '0 8px 32px rgba(37, 99, 235, .3)',
                        }}>
                        <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round"
                                d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-extrabold mb-2" style={{ color: 'var(--color-texto)' }}>
                        Conteo de Inventario
                    </h1>
                    <p className="text-lg font-medium" style={{ color: 'var(--color-primario)' }}>
                        Tecnigas
                    </p>
                    <p className="mt-3 text-sm" style={{ color: 'var(--color-texto-secundario)' }}>
                        Selecciona la ubicación donde vas a realizar el conteo
                    </p>
                </div>

                {/* Cards de ubicación */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {ubicaciones.map((ubi) => (
                        <button
                            key={ubi.id}
                            onClick={() => onSelect(ubi.id)}
                            className="group p-8 rounded-2xl text-left transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                            style={{
                                background: 'var(--color-superficie)',
                                border: '2px solid var(--color-borde)',
                                boxShadow: 'var(--sombra-card)',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = 'var(--color-primario)';
                                e.currentTarget.style.boxShadow = 'var(--sombra-elevada)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = 'var(--color-borde)';
                                e.currentTarget.style.boxShadow = 'var(--sombra-card)';
                            }}
                        >
                            <div className="mb-4" style={{ color: 'var(--color-primario)' }}>
                                {ubi.icono}
                            </div>
                            <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--color-texto)' }}>
                                {ubi.nombre}
                            </h2>
                            <p className="text-sm" style={{ color: 'var(--color-texto-secundario)' }}>
                                {ubi.descripcion}
                            </p>
                            <div className="mt-4 flex items-center gap-1 text-sm font-medium"
                                style={{ color: 'var(--color-primario)' }}>
                                Comenzar conteo
                                <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                </svg>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Botones de acción */}
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
                    {/* Ver Stock */}
                    <button
                        onClick={onVerStock}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-105 active:scale-95 cursor-pointer"
                        style={{
                            background: 'var(--color-superficie)',
                            border: '1px solid var(--color-borde)',
                            color: 'var(--color-texto-secundario)',
                        }}
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Ver Stock por Categoría
                    </button>

                    {/* Historial de envíos */}
                    <button
                        onClick={() => setVerHistorial(true)}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-105 active:scale-95 cursor-pointer"
                        style={{
                            background: 'var(--color-superficie)',
                            border: '1px solid var(--color-borde)',
                            color: 'var(--color-texto-secundario)',
                        }}
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        Historial
                    </button>

                    {/* Stock Negativo */}
                    <button
                        onClick={onVerNegativos}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-105 active:scale-95 cursor-pointer"
                        style={{
                            background: 'var(--color-error-fondo, #fef2f2)',
                            border: '1px solid var(--color-error, #dc2626)',
                            color: 'var(--color-error, #dc2626)',
                        }}
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        Stock Negativo
                    </button>
                </div>
            </div>

            {/* Modal historial */}
            {verHistorial && (
                <SubmissionHistory onClose={() => setVerHistorial(false)} />
            )}
        </div>
    );
}
