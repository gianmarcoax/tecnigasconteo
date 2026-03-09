/**
 * StockViewer – Visualizador de stock por categoría de Odoo.
 * Permite seleccionar una categoría y ver todos sus productos con stock actual.
 */
import { useState, useEffect, useMemo } from 'react';
import DarkModeToggle from '../components/DarkModeToggle';
import { obtenerCategorias, obtenerPorCategoria } from '../api/client';

/** Clasifica ubicaciones en ALM / TDA igual que InventoryTable */
function clasificarStock(stockPorUbicacion) {
    if (!stockPorUbicacion || stockPorUbicacion.length === 0) return { almacen: null, tienda: null, total: 0 };
    let almacen = 0, tienda = 0, tieneAlmacen = false, tieneTienda = false;
    for (const s of stockPorUbicacion) {
        const n = (s.location_name || '').toLowerCase();
        if (n.includes('tienda') || n.includes('shop') || n.includes('pos')) {
            tienda += s.quantity || 0; tieneTienda = true;
        } else {
            almacen += s.quantity || 0; tieneAlmacen = true;
        }
    }
    return {
        almacen: tieneAlmacen ? almacen : null,
        tienda: tieneTienda ? tienda : null,
        total: almacen + tienda,
    };
}

export default function StockViewer({ onBack, dark, onToggleDark }) {
    const [categorias, setCategorias] = useState([]);
    const [cargandoCats, setCargandoCats] = useState(true);
    const [categoriaId, setCategoriaId] = useState('');
    const [productos, setProductos] = useState([]);
    const [cargandoProd, setCargandoProd] = useState(false);
    const [busqueda, setBusqueda] = useState('');
    const [ordenCol, setOrdenCol] = useState('total_stock'); // 'nombre'|'total_stock'|'codigo_interno'
    const [ordenDir, setOrdenDir] = useState('desc');
    const [error, setError] = useState(null);

    // Cargar categorías al montar
    useEffect(() => {
        setCargandoCats(true);
        obtenerCategorias()
            .then(setCategorias)
            .catch(() => setError('No se pudieron cargar las categorías'))
            .finally(() => setCargandoCats(false));
    }, []);

    // Cargar productos al seleccionar categoría
    const cargarProductos = async (id) => {
        if (!id) return;
        setCargandoProd(true);
        setProductos([]);
        setError(null);
        setBusqueda('');
        try {
            const res = await obtenerPorCategoria(Number(id));
            setProductos(res.productos || []);
        } catch {
            setError('Error al cargar los productos de la categoría');
        } finally {
            setCargandoProd(false);
        }
    };

    const handleCategoriaChange = (e) => {
        setCategoriaId(e.target.value);
        cargarProductos(e.target.value);
    };

    // Filtrar y ordenar
    const productosFiltrados = useMemo(() => {
        let lista = productos;
        if (busqueda.trim()) {
            const q = busqueda.toLowerCase();
            lista = lista.filter(p =>
                p.nombre.toLowerCase().includes(q) ||
                (p.codigo_interno || '').toLowerCase().includes(q) ||
                (p.barcode || '').toLowerCase().includes(q)
            );
        }
        lista = [...lista].sort((a, b) => {
            let va = a[ordenCol] ?? '';
            let vb = b[ordenCol] ?? '';
            if (typeof va === 'string') va = va.toLowerCase();
            if (typeof vb === 'string') vb = vb.toLowerCase();
            if (va < vb) return ordenDir === 'asc' ? -1 : 1;
            if (va > vb) return ordenDir === 'asc' ? 1 : -1;
            return 0;
        });
        return lista;
    }, [productos, busqueda, ordenCol, ordenDir]);

    const toggleOrden = (col) => {
        if (ordenCol === col) setOrdenDir(d => d === 'asc' ? 'desc' : 'asc');
        else { setOrdenCol(col); setOrdenDir('asc'); }
    };

    const flecha = (col) => ordenCol === col ? (ordenDir === 'asc' ? ' ↑' : ' ↓') : '';

    const totalUnidades = productosFiltrados.reduce((s, p) => {
        const st = clasificarStock(p.stock_por_ubicacion);
        return s + st.total;
    }, 0);

    return (
        <div className="min-h-screen" style={{ background: 'var(--color-fondo)' }}>
            {/* HEADER */}
            <header className="sticky top-0 z-50 backdrop-blur-lg"
                style={{
                    borderBottom: '1px solid var(--color-borde)',
                    backgroundColor: dark ? 'rgba(30,41,59,.9)' : 'rgba(255,255,255,.9)',
                }}>
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={onBack}
                            className="p-2 rounded-lg transition-all hover:scale-105 cursor-pointer"
                            style={{ background: 'var(--color-fondo)', color: 'var(--color-texto)' }}
                            title="Volver">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <div>
                            <h1 className="text-lg font-bold" style={{ color: 'var(--color-texto)' }}>
                                Visualizador de Stock
                            </h1>
                            <p className="text-xs" style={{ color: 'var(--color-primario)' }}>
                                Consulta por categoría · Solo lectura
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        {productos.length > 0 && (
                            <div className="hidden sm:flex items-center gap-4">
                                <div className="text-center">
                                    <div className="text-xl font-bold" style={{ color: 'var(--color-primario)' }}>
                                        {productosFiltrados.length}
                                    </div>
                                    <div className="text-xs" style={{ color: 'var(--color-texto-secundario)' }}>Products</div>
                                </div>
                                <div className="w-px h-8" style={{ background: 'var(--color-borde)' }} />
                                <div className="text-center">
                                    <div className="text-xl font-bold" style={{ color: 'var(--color-exito)' }}>
                                        {totalUnidades}
                                    </div>
                                    <div className="text-xs" style={{ color: 'var(--color-texto-secundario)' }}>Unidades</div>
                                </div>
                            </div>
                        )}
                        <DarkModeToggle dark={dark} onToggle={onToggleDark} />
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 py-6 space-y-5">

                {/* SELECTOR + BUSQUEDA */}
                <div className="flex flex-col sm:flex-row gap-3">
                    {/* Selector categoría */}
                    <div className="flex-1">
                        <label className="block text-xs font-semibold mb-1"
                            style={{ color: 'var(--color-texto-secundario)' }}>
                            Categoría
                        </label>
                        <div className="relative">
                            <select
                                value={categoriaId}
                                onChange={handleCategoriaChange}
                                disabled={cargandoCats}
                                className="w-full rounded-xl px-4 py-3 pr-10 text-sm font-medium outline-none appearance-none cursor-pointer transition-all"
                                style={{
                                    background: 'var(--color-superficie)',
                                    border: '1px solid var(--color-borde)',
                                    color: 'var(--color-texto)',
                                }}
                            >
                                <option value="">
                                    {cargandoCats ? 'Cargando categorías...' : '— Selecciona una categoría —'}
                                </option>
                                {categorias.map(c => (
                                    <option key={c.id} value={c.id}>{c.complete_name}</option>
                                ))}
                            </select>
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
                                style={{ color: 'var(--color-texto-secundario)' }}>▾</span>
                        </div>
                    </div>

                    {/* Busqueda */}
                    {productos.length > 0 && (
                        <div className="flex-1">
                            <label className="block text-xs font-semibold mb-1"
                                style={{ color: 'var(--color-texto-secundario)' }}>
                                Buscar
                            </label>
                            <input
                                value={busqueda}
                                onChange={e => setBusqueda(e.target.value)}
                                placeholder="Nombre, código interno, barcode..."
                                className="w-full rounded-xl px-4 py-3 text-sm outline-none"
                                style={{
                                    background: 'var(--color-superficie)',
                                    border: '1px solid var(--color-borde)',
                                    color: 'var(--color-texto)',
                                }}
                            />
                        </div>
                    )}

                    {/* Botón refrescar */}
                    {categoriaId && (
                        <div className="flex items-end">
                            <button
                                onClick={() => cargarProductos(categoriaId)}
                                disabled={cargandoProd}
                                className="px-4 py-3 rounded-xl font-medium text-sm text-white transition-all hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer flex items-center gap-2"
                                style={{ background: 'var(--color-primario)' }}
                                title="Actualizar stock"
                            >
                                <svg className={`w-4 h-4 ${cargandoProd ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                {cargandoProd ? 'Cargando...' : 'Actualizar'}
                            </button>
                        </div>
                    )}
                </div>

                {/* ERROR */}
                {error && (
                    <div className="px-4 py-3 rounded-xl text-sm font-medium"
                        style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>
                        ⚠ {error}
                    </div>
                )}

                {/* CARGANDO */}
                {cargandoProd && (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <svg className="animate-spin w-10 h-10" style={{ color: 'var(--color-primario)' }} fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        <p className="text-sm" style={{ color: 'var(--color-texto-secundario)' }}>
                            Consultando productos y stock en Odoo...
                        </p>
                    </div>
                )}

                {/* TABLA */}
                {!cargandoProd && productosFiltrados.length > 0 && (
                    <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid var(--color-borde)' }}>
                        <table className="w-full text-sm">
                            <thead>
                                <tr style={{ background: 'var(--color-primario)', color: '#fff' }}>
                                    <th className="text-left px-4 py-3 font-semibold">#</th>
                                    <th className="text-left px-4 py-3 font-semibold cursor-pointer select-none hover:opacity-80"
                                        onClick={() => toggleOrden('codigo_interno')}>
                                        Código{flecha('codigo_interno')}
                                    </th>
                                    <th className="text-left px-4 py-3 font-semibold cursor-pointer select-none hover:opacity-80"
                                        onClick={() => toggleOrden('nombre')}>
                                        Producto{flecha('nombre')}
                                    </th>
                                    <th className="text-center px-4 py-3 font-semibold">ALM</th>
                                    <th className="text-center px-4 py-3 font-semibold">TDA</th>
                                    <th className="text-center px-4 py-3 font-semibold cursor-pointer select-none hover:opacity-80 whitespace-nowrap"
                                        onClick={() => toggleOrden('total_stock')}>
                                        Total{flecha('total_stock')}
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {productosFiltrados.map((prod, index) => {
                                    const st = clasificarStock(prod.stock_por_ubicacion);
                                    const noStock = st.total === 0;
                                    return (
                                        <tr key={prod.id}
                                            className="transition-colors duration-100"
                                            style={{
                                                background: index % 2 === 0 ? 'var(--color-superficie)' : 'var(--color-fondo)',
                                                borderBottom: '1px solid var(--color-borde)',
                                                opacity: noStock ? 0.5 : 1,
                                            }}>
                                            <td className="px-4 py-3 text-xs font-mono"
                                                style={{ color: 'var(--color-texto-secundario)' }}>
                                                {index + 1}
                                            </td>
                                            <td className="px-4 py-3 font-mono text-xs"
                                                style={{ color: 'var(--color-texto-secundario)' }}>
                                                {prod.codigo_interno || prod.barcode || '—'}
                                            </td>
                                            <td className="px-4 py-3 font-medium"
                                                style={{ color: 'var(--color-texto)' }}>
                                                {prod.nombre}
                                            </td>
                                            <td className="px-4 py-3 text-center font-bold"
                                                style={{ color: st.almacen ? 'var(--color-primario)' : 'var(--color-texto-secundario)' }}>
                                                {st.almacen ?? '—'}
                                            </td>
                                            <td className="px-4 py-3 text-center font-bold"
                                                style={{ color: st.tienda ? 'var(--color-exito)' : 'var(--color-texto-secundario)' }}>
                                                {st.tienda ?? '—'}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className="px-2 py-0.5 rounded-full text-xs font-bold"
                                                    style={{
                                                        background: noStock ? 'var(--color-fondo)' : 'rgba(37,99,235,.12)',
                                                        color: noStock ? 'var(--color-texto-secundario)' : 'var(--color-primario)',
                                                        border: '1px solid var(--color-borde)',
                                                    }}>
                                                    {st.total}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* SIN PRODUCTOS */}
                {!cargandoProd && categoriaId && productos.length === 0 && !error && (
                    <div className="text-center py-16" style={{ color: 'var(--color-texto-secundario)' }}>
                        <p className="text-lg font-semibold">Sin productos en esta categoría</p>
                        <p className="text-sm mt-1">O ninguno tiene stock registrado</p>
                    </div>
                )}

                {/* PLACEHOLDER sin categoría */}
                {!categoriaId && !cargandoCats && (
                    <div className="text-center py-20" style={{ color: 'var(--color-texto-secundario)' }}>
                        <svg className="w-16 h-16 mx-auto mb-4 opacity-25" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                        </svg>
                        <p className="text-xl font-semibold mb-1">Selecciona una categoría</p>
                        <p className="text-sm">para ver el stock de sus productos</p>
                    </div>
                )}
            </main>
        </div>
    );
}
