import { useState, useEffect } from 'react';
import { obtenerStockNegativo } from '../api/client';
import DarkModeToggle from '../components/DarkModeToggle';

export default function NegativeStockViewer({ onBack, dark, onToggleDark }) {
    const [productos, setProductos] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);
    const [busqueda, setBusqueda] = useState('');

    useEffect(() => {
        cargarNegativos();
    }, []);

    const cargarNegativos = async () => {
        setCargando(true);
        setError(null);
        try {
            const data = await obtenerStockNegativo();
            if (data.exito) {
                setProductos(data.productos || []);
            } else {
                setError(data.mensaje || 'Error al obtener negativos');
            }
        } catch (err) {
            setError(err.message || 'Error de conexión');
        } finally {
            setCargando(false);
        }
    };

    const filtrados = productos.filter(p => {
        const q = busqueda.toLowerCase();
        return p.nombre.toLowerCase().includes(q) ||
            p.codigo_barras.toLowerCase().includes(q) ||
            p.codigo_interno.toLowerCase().includes(q);
    });

    return (
        <div className="min-h-screen pb-20 p-4 sm:p-6" style={{ background: 'var(--color-fondo)' }}>
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header Superior */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-2xl shadow-sm"
                    style={{ background: 'var(--color-superficie)', border: '1px solid var(--color-borde)' }}>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={onBack}
                            className="p-2 rounded-xl transition-colors hover:bg-black/5 dark:hover:bg-white/10"
                            style={{ color: 'var(--color-texto-secundario)' }}
                            title="Volver"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--color-error)' }}>
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                Stock Negativo en Odoo
                            </h1>
                            <p className="text-sm mt-1" style={{ color: 'var(--color-texto-secundario)' }}>
                                Productos con cantidades bajo cero en ubicaciones internas
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="text-center px-4 border-r" style={{ borderColor: 'var(--color-borde)' }}>
                            <div className="text-sm" style={{ color: 'var(--color-texto-secundario)' }}>Total en Rojo</div>
                            <div className="text-xl font-bold" style={{ color: 'var(--color-texto)' }}>{productos.length}</div>
                        </div>
                        <DarkModeToggle dark={dark} onToggle={onToggleDark} />
                    </div>
                </div>

                {/* Buscador */}
                <div className="p-4 rounded-2xl shadow-sm space-y-4"
                    style={{ background: 'var(--color-superficie)', border: '1px solid var(--color-borde)' }}>
                    <div className="relative flex-1 group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            placeholder="Buscar en la lista de negativos..."
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            className="block w-full pl-10 pr-3 py-3 border rounded-xl leading-5 bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 sm:text-sm transition-all shadow-sm"
                            style={{
                                color: 'var(--color-texto)',
                                borderColor: 'var(--color-borde)'
                            }}
                        />
                    </div>
                </div>

                {/* Tabla de Productos */}
                <div className="rounded-2xl shadow-sm overflow-hidden" style={{ background: 'var(--color-superficie)', border: '1px solid var(--color-borde)' }}>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y" style={{ borderColor: 'var(--color-borde)' }}>
                            <thead style={{ background: 'var(--color-fondo)' }}>
                                <tr>
                                    <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider w-12" style={{ color: 'var(--color-texto-secundario)' }}>#</th>
                                    <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-texto-secundario)' }}>Producto</th>
                                    <th className="px-4 py-4 text-left text-xs font-bold uppercase tracking-wider w-32" style={{ color: 'var(--color-texto-secundario)' }}>Código</th>
                                    <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider w-40" style={{ color: 'var(--color-texto-secundario)' }}>Detalle Stock</th>
                                    <th className="px-4 py-4 text-center text-xs font-bold uppercase tracking-wider w-24" style={{ color: 'var(--color-texto-secundario)' }}>Total</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y" style={{ borderColor: 'var(--color-borde)' }}>
                                {cargando ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center text-sm" style={{ color: 'var(--color-texto-secundario)' }}>
                                            <div className="flex flex-col items-center justify-center gap-3">
                                                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                                                <p>Obteniendo negativos de Odoo...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : error ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                                <p className="font-bold text-red-500">{error}</p>
                                                <button onClick={cargarNegativos} className="mt-2 text-sm text-blue-500 underline hover:text-blue-600">Reintentar</button>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filtrados.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-6 py-12 text-center text-sm font-medium" style={{ color: 'var(--color-texto-secundario)' }}>
                                            {busqueda ? 'No hay resultados para tu búsqueda.' : '¡Excelente! No hay productos con stock negativo.'}
                                        </td>
                                    </tr>
                                ) : (
                                    filtrados.map((prod, index) => (
                                        <tr key={prod.id_odoo} className="transition-colors hover:bg-black/5 dark:hover:bg-white/5 bg-red-50/30 dark:bg-red-900/10">
                                            <td className="px-4 py-3 text-sm font-medium" style={{ color: 'var(--color-texto-secundario)' }}>
                                                {index + 1}
                                            </td>
                                            <td className="px-4 py-3">
                                                <p className="text-sm font-bold truncate max-w-xs sm:max-w-md" style={{ color: 'var(--color-texto)' }}>
                                                    {prod.nombre}
                                                </p>
                                                <p className="text-xs mt-1 font-mono" style={{ color: 'var(--color-success, #10b981)' }}>
                                                    S/ {parseFloat(prod.precio || 0).toFixed(2)}
                                                </p>
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                <p className="font-mono text-xs" style={{ color: 'var(--color-texto)' }}>{prod.codigo_barras || '-'}</p>
                                                {prod.codigo_interno && (
                                                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-texto-secundario)' }}>Ref: {prod.codigo_interno}</p>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex flex-col gap-1 items-center justify-center">
                                                    {prod.stock_por_ubicacion.filter(s => s.quantity < 0).map((loc, i) => (
                                                        <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400 font-bold whitespace-nowrap">
                                                            {loc.location_name}: {loc.quantity}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="inline-flex items-center justify-center px-2.5 py-1 rounded-full text-sm font-bold bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400">
                                                    {prod.total_stock}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
