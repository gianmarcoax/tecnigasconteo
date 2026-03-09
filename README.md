# Conteo de Inventario con Código de Barras para Odoo

Sistema de conteo de inventario rápido y eficiente, diseñado para trabajar con escáneres USB de código de barras y sincronizar los resultados directamente con **Odoo** mediante su API JSON-RPC.

---

## Características

- **Selección de ubicación**: Elige entre Almacén o Tienda antes de iniciar el conteo
- **Escaneo rápido**: Soporte para escáneres USB que funcionan como teclado (< 100ms por escaneo)
- **Dashboard en tiempo real**: Tabla actualizada al instante con cada escaneo
- **Controles de cantidad**: Incrementar, decrementar, editar manualmente o eliminar productos
- **Búsqueda de productos**: Filtra la tabla por nombre o código de barras
- **Envío a Odoo**: Sincroniza las cantidades contadas con el inventario de Odoo
- **Importar CSV**: Carga masiva de productos desde archivos CSV
- **Exportar a Excel**: Descarga el conteo actual como archivo `.xlsx`
- **Modo oscuro**: Interfaz adaptable con tema claro/oscuro
- **Retroalimentación sonora**: Tonos audibles al escanear (éxito/error)
- **Rendimiento**: Soporta hasta 10,000 productos con procesamiento sub-100ms

---

## Stack Tecnológico

| Componente | Tecnología |
|---|---|
| Frontend | React + Vite + TailwindCSS |
| Backend | Python + FastAPI |
| Base de datos | Odoo (JSON-RPC API) |
| Comunicación | REST API |

---

## Instalación

### Requisitos previos

- **Python** 3.10+
- **Node.js** 18+
- **npm** 9+
- Acceso a una instancia de **Odoo** con API habilitada

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/odoo-barcode-inventory.git
cd odoo-barcode-inventory
```

### 2. Configurar el backend

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate
# Linux/Mac
source .venv/bin/activate

pip install -r requirements.txt
```

### 3. Configurar variables de entorno

Copia el archivo de ejemplo y edítalo con tus credenciales:

```bash
cp .env.example .env
```

Edita `.env`:

```env
ODOO_URL=https://tu-instancia-odoo.com
ODOO_DB=nombre_de_tu_base_de_datos
ODOO_USER=tu_usuario@ejemplo.com
ODOO_API_KEY=tu_clave_api_aqui
```

### 4. Iniciar el backend

```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 5. Configurar e iniciar el frontend

```bash
cd ../frontend
npm install
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

---

## Configuración del Escáner USB

1. Conecta tu escáner USB de código de barras
2. Asegúrate de que el escáner esté configurado para:
   - Enviar un **ENTER** después de cada código
   - Funcionar en modo **teclado** (HID)
3. Abre la aplicación y comienza a escanear

> ⚠️ El campo de entrada siempre mantiene el foco automáticamente para capturar los escaneos.

---

## Configuración de Odoo

### API Key

1. Ve a tu perfil de usuario en Odoo
2. En la pestaña "Seguridad de la cuenta", genera una **Clave API**
3. Usa esta clave en la variable `ODOO_API_KEY`

### Ubicaciones

El sistema busca ubicaciones internas (`stock.location` con `usage = 'internal'`) automáticamente desde Odoo. Las etiquetas "Almacén" y "Tienda" se mapean por nombre.

---

## Formato CSV para importación

```csv
codigo_barras,nombre
7750000001234,Producto A
7750000005678,Producto B
```

---

## Despliegue

### Frontend

- **Vercel**: `cd frontend && vercel`
- **Netlify**: Conecta el repo y configura el directorio `frontend` con `npm run build`

### Backend

- **Docker**: Usa el `docker-compose.yml` incluido
- **PythonAnywhere**: Sube los archivos del backend y configura la variable WSGI
- **VPS**: Usa `uvicorn` detrás de Nginx con `systemd`

---

## Docker

```bash
docker-compose up --build
```

---

## Estructura del Proyecto

```
conteo-inventario/
├── backend/
│   ├── main.py              # Punto de entrada FastAPI
│   ├── odoo_client.py       # Cliente JSON-RPC para Odoo
│   ├── requirements.txt     # Dependencias Python
│   ├── .env.example          # Variables de entorno (ejemplo)
│   ├── models/
│   │   └── schemas.py       # Modelos Pydantic
│   └── routes/
│       ├── products.py      # Rutas de productos
│       └── inventory.py     # Rutas de inventario
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Componente raíz
│   │   ├── api/
│   │   │   └── client.js    # Cliente API (Axios)
│   │   ├── components/
│   │   │   ├── BarcodeInput.jsx
│   │   │   ├── InventoryTable.jsx
│   │   │   ├── SearchBar.jsx
│   │   │   ├── DarkModeToggle.jsx
│   │   │   └── SoundFeedback.js
│   │   └── pages/
│   │       ├── LocationSelector.jsx
│   │       └── Dashboard.jsx
│   └── index.html
├── README.md
├── LICENSE
├── .env.example
└── docker-compose.yml
```

---

## Contribuir

1. Fork del repositorio
2. Crea una rama: `git checkout -b feature/mi-mejora`
3. Haz commit: `git commit -m "Agrega mi mejora"`
4. Push: `git push origin feature/mi-mejora`
5. Abre un Pull Request

---

## Licencia

Este proyecto está bajo la licencia [MIT](LICENSE).
