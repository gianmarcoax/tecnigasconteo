/**
 * Dashboard principal – Conteo de inventario en tiempo real.
 * Aquí se escanean productos, se visualiza el conteo y se envía a Odoo.
 */
import { useState, useCallback, useRef, useMemo } from 'react';
import BarcodeInput from '../components/BarcodeInput';
import InventoryTable from '../components/InventoryTable';
import SearchBar from '../components/SearchBar';
import DarkModeToggle from '../components/DarkModeToggle';
import BulkImport from '../components/BulkImport';
import { sonidoExito, sonidoError, sonidoIncremento } from '../components/SoundFeedback';
import { buscarProducto, enviarInventario, importarCSV, exportarExcel, obtenerStock } from '../api/client';

export default function Dashboard({ ubicacion, onBack, dark, onToggleDark }) {
    // Estado del inventario – Map para acceso O(1) por código de barras
    const [inventario, setInventario] = useState(new Map());
    const [busqueda, setBusqueda] = useState('');
    const [alerta, setAlerta] = useState(null);
    const [enviando, setEnviando] = useState(false);
    const [estadoEnvio, setEstadoEnvio] = useState(null);
    const [showBulk, setShowBulk] = useState(false);
    const [cargandoBulk, setCargandoBulk] = useState(false);
    const fileInputRef = useRef(null);

    const nombreUbicacion = ubicacion === 'almacen' ? 'Almacén' : 'Tienda';

    // ---------------------------------------------------------------- #
    //  Mostrar alerta temporal                                          #
    // ---------------------------------------------------------------- #
    const mostrarAlerta = useCallback((mensaje, tipo = 'info', duracion = 3000) => {
        setAlerta({ mensaje, tipo });
        setTimeout(() => setAlerta(null), duracion);
    }, []);

    // ---------------------------------------------------------------- #
    //  Manejar escaneo de código de barras                              #
    // ---------------------------------------------------------------- #
    const manejarEscaneo = useCallback(async (codigoBarras) => {
        // Si el producto ya está en el conteo, solo incrementar
        if (inventario.has(codigoBarras)) {
            setInventario((prev) => {
                const nuevo = new Map(prev);
                const item = { ...nuevo.get(codigoBarras) };
                item.cantidad += 1;
                nuevo.set(codigoBarras, item);
                return nuevo;
            });
            sonidoIncremento();
            mostrarAlerta(`+1 → ${inventario.get(codigoBarras).nombre} (${inventario.get(codigoBarras).cantidad + 1})`, 'exito');
            return;
        }

        try {
            const resultado = await buscarProducto(codigoBarras);

            if (resultado.encontrado && resultado.producto) {
                const prod = resultado.producto;

                // Obtener stock actual
                let stock_por_ubicacion = null;
                let ultimo_movimiento = null;
                if (prod.id_odoo) {
                    try {
                        const stockRes = await obtenerStock(prod.id_odoo);
                        stock_por_ubicacion = stockRes.stock_por_ubicacion;
                        ultimo_movimiento = stockRes.ultimo_movimiento;
                    } catch (e) {
                        console.error('Error obteniendo stock:', e);
                    }
                }

                setInventario((prev) => {
                    const nuevo = new Map(prev);
                    nuevo.set(prod.codigo_barras, {
                        id_odoo: prod.id_odoo,
                        codigo_barras: prod.codigo_barras,
                        nombre: prod.nombre,
                        cantidad: 1,
                        stock_por_ubicacion,
                        ultimo_movimiento,
                    });
                    return nuevo;
                });
                sonidoExito();
                mostrarAlerta(`Producto agregado: ${prod.nombre}`, 'exito');
            } else {
                sonidoError();
                mostrarAlerta(`Producto no encontrado: ${codigoBarras}`, 'error', 4000);
            }
        } catch (error) {
            sonidoError();
            mostrarAlerta(`Error de conexión: ${error.message}`, 'error', 4000);
        }
    }, [inventario, mostrarAlerta]);

    // ---------------------------------------------------------------- #
    //  Actualizar cantidad                                              #
    // ---------------------------------------------------------------- #
    const actualizarCantidad = useCallback((codigoBarras, nuevaCantidad) => {
        setInventario((prev) => {
            const nuevo = new Map(prev);
            if (nuevo.has(codigoBarras)) {
                const item = { ...nuevo.get(codigoBarras), cantidad: nuevaCantidad };
                nuevo.set(codigoBarras, item);
            }
            return nuevo;
        });
    }, []);

    // ---------------------------------------------------------------- #
    //  Eliminar producto del conteo                                     #
    // ---------------------------------------------------------------- #
    const eliminarProducto = useCallback((codigoBarras) => {
        setInventario((prev) => {
            const nuevo = new Map(prev);
            nuevo.delete(codigoBarras);
            return nuevo;
        });
    }, []);

    // ---------------------------------------------------------------- #
    //  Filtrar items                                                    #
    // ---------------------------------------------------------------- #
    const itemsFiltrados = useMemo(() => {
        const items = Array.from(inventario.values());
        if (!busqueda.trim()) return items;
        const q = busqueda.toLowerCase();
        return items.filter(
            (item) =>
                item.nombre.toLowerCase().includes(q) ||
                item.codigo_barras.toLowerCase().includes(q)
        );
    }, [inventario, busqueda]);

    // ---------------------------------------------------------------- #
    //  Enviar a Odoo                                                    #
    // ---------------------------------------------------------------- #
    const manejarEnvio = useCallback(async () => {
        const items = Array.from(inventario.values()).filter((i) => i.cantidad > 0);
        if (items.length === 0) {
            mostrarAlerta('No hay productos con cantidad mayor a 0 para enviar', 'advertencia');
            return;
        }

        setEnviando(true);
        setEstadoEnvio(null);
        try {
            const resultado = await enviarInventario(ubicacion, items);
            setEstadoEnvio(resultado);
            if (resultado.exito) {
                sonidoExito();
                mostrarAlerta(`✓ ${resultado.mensaje}`, 'exito', 5000);
            } else {
                sonidoError();
                mostrarAlerta(`⚠ ${resultado.mensaje}`, 'advertencia', 5000);
            }
        } catch (error) {
            sonidoError();
            mostrarAlerta(`Error al enviar: ${error.message}`, 'error', 5000);
        } finally {
            setEnviando(false);
        }
    }, [inventario, ubicacion, mostrarAlerta]);

    // ---------------------------------------------------------------- #
    //  Importar carga masiva (TCT)                                       #
    // ---------------------------------------------------------------- #
    const manejarBulkImport = useCallback(async (mapa, onProgress) => {
        // mapa: Map<codigo, cantidad>
        setCargandoBulk(true);
        let agregados = 0;
        const codigosNoEncontrados = [];
        let procesados = 0;

        for (const [codigo, cantidad] of mapa.entries()) {
            // Si ya existe en inventario, solo sumar
            if (inventario.has(codigo)) {
                setInventario((prev) => {
                    const nuevo = new Map(prev);
                    const item = { ...nuevo.get(codigo) };
                    item.cantidad += cantidad;
                    nuevo.set(codigo, item);
                    return nuevo;
                });
                agregados++;
                onProgress?.(++procesados);
                continue;
            }

            try {
                const resultado = await buscarProducto(codigo);
                if (resultado.encontrado && resultado.producto) {
                    const prod = resultado.producto;
                    let stock_por_ubicacion = null;
                    let ultimo_movimiento = null;
                    if (prod.id_odoo) {
                        try {
                            const stockRes = await obtenerStock(prod.id_odoo);
                            stock_por_ubicacion = stockRes.stock_por_ubicacion;
                            ultimo_movimiento = stockRes.ultimo_movimiento;
                        } catch { /* silenciar */ }
                    }
                    setInventario((prev) => {
                        const nuevo = new Map(prev);
                        const existente = nuevo.get(prod.codigo_barras);
                        nuevo.set(prod.codigo_barras, {
                            id_odoo: prod.id_odoo,
                            codigo_barras: prod.codigo_barras,
                            nombre: prod.nombre,
                            cantidad: (existente ? existente.cantidad : 0) + cantidad,
                            stock_por_ubicacion,
                            ultimo_movimiento,
                        });
                        return nuevo;
                    });
                    agregados++;
                } else {
                    codigosNoEncontrados.push(codigo);
                }
            } catch {
                codigosNoEncontrados.push(codigo);
            }
            onProgress?.(++procesados);
        }

        setCargandoBulk(false);
        if (codigosNoEncontrados.length === 0) {
            sonidoExito();
            mostrarAlerta(`${agregados} productos importados correctamente`, 'exito', 4000);
        } else {
            sonidoError();
            mostrarAlerta(`${agregados} importados · ${codigosNoEncontrados.length} no encontrados`, 'advertencia', 5000);
        }
        return { agregados, noEncontrados: codigosNoEncontrados };
    }, [inventario, mostrarAlerta]);

    // ---------------------------------------------------------------- #
    //  Importar CSV                                                     #
    // ---------------------------------------------------------------- #
    const manejarImportCSV = useCallback(async (e) => {
        const archivo = e.target.files?.[0];
        if (!archivo) return;
        try {
            const resultado = await importarCSV(archivo);
            if (resultado.productos) {
                setInventario((prev) => {
                    const nuevo = new Map(prev);
                    for (const prod of resultado.productos) {
                        if (!nuevo.has(prod.codigo_barras)) {
                            nuevo.set(prod.codigo_barras, {
                                id_odoo: null,
                                codigo_barras: prod.codigo_barras,
                                nombre: prod.nombre,
                                cantidad: 0,
                            });
                        }
                    }
                    return nuevo;
                });
                mostrarAlerta(resultado.mensaje, 'exito');
            }
        } catch (error) {
            mostrarAlerta(`Error al importar CSV: ${error.message}`, 'error');
        }
        e.target.value = '';
    }, [mostrarAlerta]);

    // ---------------------------------------------------------------- #
    //  Exportar Excel                                                   #
    // ---------------------------------------------------------------- #
    const manejarExportExcel = useCallback(async () => {
        const items = Array.from(inventario.values());
        if (items.length === 0) {
            mostrarAlerta('No hay productos para exportar', 'advertencia');
            return;
        }
        try {
            await exportarExcel(items);
            mostrarAlerta('Archivo Excel descargado', 'exito');
        } catch (error) {
            mostrarAlerta(`Error al exportar: ${error.message}`, 'error');
        }
    }, [inventario, mostrarAlerta]);

    // ---------------------------------------------------------------- #
    //  Estadísticas                                                     #
    // ---------------------------------------------------------------- #
    const totalProductos = inventario.size;
    const totalUnidades = Array.from(inventario.values()).reduce((s, i) => s + i.cantidad, 0);

    // ---------------------------------------------------------------- #
    //  Colores de alerta                                                #
    // ---------------------------------------------------------------- #
    const coloresAlerta = {
        exito: { bg: '#059669', text: '#fff' },
        error: { bg: '#dc2626', text: '#fff' },
        advertencia: { bg: '#d97706', text: '#fff' },
        info: { bg: '#2563eb', text: '#fff' },
    };

    return (
        <div className="min-h-screen" style={{ background: 'var(--color-fondo)' }}>
            {/* Modal carga masiva */}
            {showBulk && (
                <BulkImport
                    onImport={manejarBulkImport}
                    onClose={() => setShowBulk(false)}
                />
            )}
            {/* ============ HEADER ============ */}
            <header className="sticky top-0 z-50 backdrop-blur-lg"
                style={{
                    background: 'rgba(var(--color-superficie), .85)',
                    borderBottom: '1px solid var(--color-borde)',
                    backgroundColor: dark ? 'rgba(30,41,59,.85)' : 'rgba(255,255,255,.85)',
                }}>
                <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onBack}
                            className="p-2 rounded-lg transition-all hover:scale-105 cursor-pointer"
                            style={{ background: 'var(--color-fondo)', color: 'var(--color-texto)' }}
                            title="Volver a selección de ubicación"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <div>
                            <h1 className="text-lg font-bold" style={{ color: 'var(--color-texto)' }}>
                                Conteo de Inventario
                            </h1>
                            <p className="text-xs font-medium" style={{ color: 'var(--color-primario)' }}>
                                📍 {nombreUbicacion}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Estadísticas rápidas */}
                        <div className="hidden sm:flex items-center gap-4">
                            <div className="text-center">
                                <div className="text-xl font-bold" style={{ color: 'var(--color-primario)' }}>
                                    {totalProductos}
                                </div>
                                <div className="text-xs" style={{ color: 'var(--color-texto-secundario)' }}>
                                    Productos
                                </div>
                            </div>
                            <div className="w-px h-8" style={{ background: 'var(--color-borde)' }} />
                            <div className="text-center">
                                <div className="text-xl font-bold" style={{ color: 'var(--color-exito)' }}>
                                    {totalUnidades}
                                </div>
                                <div className="text-xs" style={{ color: 'var(--color-texto-secundario)' }}>
                                    Unidades
                                </div>
                            </div>
                        </div>
                        <DarkModeToggle dark={dark} onToggle={onToggleDark} />
                    </div>
                </div>
            </header>

            {/* ============ ALERTA ============ */}
            {alerta && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animar-entrada">
                    <div className="px-6 py-3 rounded-xl shadow-2xl font-semibold text-sm flex items-center gap-2"
                        style={{
                            backgroundColor: coloresAlerta[alerta.tipo]?.bg || coloresAlerta.info.bg,
                            color: coloresAlerta[alerta.tipo]?.text || '#fff',
                        }}>
                        {alerta.mensaje}
                    </div>
                </div>
            )}

            {/* ============ CONTENIDO ============ */}
            <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
                {/* Escáner */}
                <BarcodeInput onScan={manejarEscaneo} disabled={enviando || showBulk} />

                {/* Barra de herramientas */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                    <div className="flex-1">
                        <SearchBar value={busqueda} onChange={setBusqueda} />
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Importar CSV */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv"
                            onChange={manejarImportCSV}
                            className="hidden"
                        />
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-2"
                            style={{
                                background: 'var(--color-superficie)',
                                border: '1px solid var(--color-borde)',
                                color: 'var(--color-texto)',
                            }}
                            title="Importar productos desde CSV"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            CSV
                        </button>

                        {/* Carga masiva TCT */}
                        <button
                            onClick={() => setShowBulk(true)}
                            disabled={cargandoBulk}
                            className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-2 disabled:opacity-50"
                            style={{
                                background: 'var(--color-primario)',
                                color: '#fff',
                            }}
                            title="Carga masiva por texto"
                        >
                            {cargandoBulk ? (
                                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                            ) : (
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h10" />
                                </svg>
                            )}
                            TCT
                        </button>

                        {/* Exportar Excel */}
                        <button
                            onClick={manejarExportExcel}
                            className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-2"
                            style={{
                                background: 'var(--color-superficie)',
                                border: '1px solid var(--color-borde)',
                                color: 'var(--color-texto)',
                            }}
                            title="Exportar conteo a Excel"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Excel
                        </button>

                        {/* Limpiar todo */}
                        {totalProductos > 0 && (
                            <button
                                onClick={() => { setInventario(new Map()); mostrarAlerta('Conteo reiniciado', 'info'); }}
                                className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-105 active:scale-95 cursor-pointer"
                                style={{
                                    background: 'var(--color-peligro)',
                                    color: '#fff',
                                }}
                                title="Reiniciar conteo"
                            >
                                Limpiar
                            </button>
                        )}
                    </div>
                </div>

                {/* Stats móvil */}
                <div className="flex sm:hidden items-center justify-center gap-6 p-3 rounded-xl"
                    style={{ background: 'var(--color-superficie)', border: '1px solid var(--color-borde)' }}>
                    <div className="text-center">
                        <div className="text-xl font-bold" style={{ color: 'var(--color-primario)' }}>{totalProductos}</div>
                        <div className="text-xs" style={{ color: 'var(--color-texto-secundario)' }}>Productos</div>
                    </div>
                    <div className="w-px h-8" style={{ background: 'var(--color-borde)' }} />
                    <div className="text-center">
                        <div className="text-xl font-bold" style={{ color: 'var(--color-exito)' }}>{totalUnidades}</div>
                        <div className="text-xs" style={{ color: 'var(--color-texto-secundario)' }}>Unidades</div>
                    </div>
                </div>

                {/* Tabla de inventario */}
                <InventoryTable
                    items={itemsFiltrados}
                    onUpdateQty={actualizarCantidad}
                    onRemove={eliminarProducto}
                />

                {/* Botón enviar a Odoo */}
                {totalProductos > 0 && (
                    <div className="flex flex-col items-center gap-4 pt-4 animar-entrada">
                        <button
                            onClick={manejarEnvio}
                            disabled={enviando}
                            className="px-8 py-4 rounded-2xl text-lg font-bold text-white transition-all duration-300 hover:scale-105 hover:-translate-y-0.5 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center gap-3"
                            style={{
                                background: enviando
                                    ? 'var(--color-texto-secundario)'
                                    : 'linear-gradient(135deg, var(--color-exito), #047857)',
                                boxShadow: enviando ? 'none' : '0 8px 32px rgba(16, 185, 129, .3)',
                            }}
                        >
                            {enviando ? (
                                <>
                                    <svg className="animate-spin w-6 h-6" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor"
                                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                                    </svg>
                                    Enviando a Odoo...
                                </>
                            ) : (
                                <>
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                        <path strokeLinecap="round" strokeLinejoin="round"
                                            d="M7 11l5-5m0 0l5 5m-5-5v12" />
                                    </svg>
                                    Enviar inventario a Odoo
                                </>
                            )}
                        </button>

                        {/* Resultado del envío */}
                        {estadoEnvio && (
                            <div className="w-full max-w-lg p-4 rounded-xl animar-entrada"
                                style={{
                                    background: 'var(--color-superficie)',
                                    border: `2px solid ${estadoEnvio.exito ? 'var(--color-exito)' : 'var(--color-advertencia)'}`,
                                }}>
                                <p className="font-semibold mb-1" style={{ color: 'var(--color-texto)' }}>
                                    {estadoEnvio.exito ? '✓ Envío exitoso' : '⚠ Envío parcial'}
                                </p>
                                <p className="text-sm" style={{ color: 'var(--color-texto-secundario)' }}>
                                    {estadoEnvio.mensaje}
                                </p>
                                {estadoEnvio.errores?.length > 0 && (
                                    <ul className="mt-2 space-y-1">
                                        {estadoEnvio.errores.map((err, i) => (
                                            <li key={i} className="text-xs" style={{ color: 'var(--color-peligro)' }}>
                                                • {err}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
