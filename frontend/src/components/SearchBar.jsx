/**
 * Barra de búsqueda para filtrar productos en la tabla.
 */
export default function SearchBar({ value, onChange }) {
    return (
        <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5"
                style={{ color: 'var(--color-texto-secundario)' }}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder="Buscar por nombre o código de barras..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm outline-none transition-all duration-200"
                style={{
                    background: 'var(--color-superficie)',
                    border: '1px solid var(--color-borde)',
                    color: 'var(--color-texto)',
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--color-primario)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--color-borde)'}
            />
        </div>
    );
}
