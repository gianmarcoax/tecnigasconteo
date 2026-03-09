/**
 * App principal – Conteo de Inventario Tecnigas.
 * Administra el estado global, modo oscuro y navegación entre páginas.
 */
import { useState, useEffect, useCallback } from 'react';
import LocationSelector from './pages/LocationSelector';
import Dashboard from './pages/Dashboard';
import StockViewer from './pages/StockViewer';
import './index.css';

export default function App() {
  const [ubicacion, setUbicacion] = useState(null);
  const [vistaStock, setVistaStock] = useState(false);
  const [dark, setDark] = useState(() => {
    // Recuperar preferencia guardada
    const guardado = localStorage.getItem('tema-oscuro');
    if (guardado !== null) return guardado === 'true';
    // O usar preferencia del sistema
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  // Aplicar/remover clase dark en <html>
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('tema-oscuro', String(dark));
  }, [dark]);

  const alternarDark = useCallback(() => setDark((prev) => !prev), []);

  const seleccionarUbicacion = useCallback((ubi) => {
    setUbicacion(ubi);
  }, []);

  const volverASeleccion = useCallback(() => {
    setUbicacion(null);
    setVistaStock(false);
  }, []);

  // Visualizador de stock
  if (vistaStock) {
    return (
      <StockViewer
        onBack={() => setVistaStock(false)}
        dark={dark}
        onToggleDark={alternarDark}
      />
    );
  }

  // Si no hay ubicación seleccionada, mostrar selector
  if (!ubicacion) {
    return <LocationSelector onSelect={seleccionarUbicacion} onVerStock={() => setVistaStock(true)} />;
  }

  // Dashboard principal
  return (
    <Dashboard
      ubicacion={ubicacion}
      onBack={volverASeleccion}
      dark={dark}
      onToggleDark={alternarDark}
    />
  );
}
