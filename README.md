# EcoPuntos Pamplona — Sistema de Incentivos de Reciclaje

Plataforma web de reciclaje para la ciudad de **Pamplona, Norte de Santander (Colombia)**, desarrollada para el curso **Desarrollo Orientado a Plataformas** de la Universidad de Pamplona.

**Stack Tecnológico:**
- **Frontend:** Angular 18+ (Standalone Components, TypeScript, ReactiveForms, Signals, Interceptores, Guards, QRCode, Modo Invitado)
- **Backend:** FastAPI 0.142+ (Python 3.13, Pydantic v2, SQLAlchemy 2.0+, JWT, Uvicorn)
- **Base de Datos:** PostgreSQL 15 + PostGIS 3.3 (Docker) / Resiliencia SQLite local (`ecopuntos.db`)

---

## Cómo funciona la aplicación (Flujos Unificados)

El sistema soporta 3 flujos operativos unificados según el rol o estado del usuario:

```mermaid
graph TD
    A[Inicio / Login] --> B{Autenticado?}
    B -- No / Modo Invitado 🟢 --> C[Vista Pública: Mapa Ecopuntos, Premios y Ranking]
    B -- Sí --> D{Rol del Usuario}
    
    D -- Ciudadano --> E[Carnet QR & Pre-solicitud]
    E --> E1[Presentar Carnet QR en EcoPunto]
    E --> E2[Crear Ticket de Pre-solicitud ⏳ Pendiente]
    E --> E3[Consultar Mis Entregas e Historial]
    E --> E4[Catálogo y Canje de Premios]

    D -- Gestor de Punto --> F[Módulo de Punto de Acopio]
    F --> F1[Escaneo de Carnet QR o Búsqueda por ID]
    F1 --> F2[Formulario de Pesaje en Báscula ⚖️]
    F2 --> F3[Aprobación Inmediata y Acreditación de Puntos ✅]
    F --> F4[Bandeja de Pre-solicitudes Pendientes 📥]

    D -- Administrador --> G[Dashboard Administrador]
    G --> G1[Gestión y Registro de Gestores de Punto]
    G --> G2[CRUD de Ecopuntos y Ubicaciones]
    G --> G3[CRUD de Materiales (Puntos/CO₂ por kg)]
    G --> G4[CRUD de Catálogo de Recompensas]
    G --> G5[Métricas Ejecutivas Globales en Tiempo Real]
```

### 0️⃣ Modo Invitado (Acceso Público)
1. **Acceso sin Registro**: Permite ingresar desde la pantalla de login o la barra de navegación sin credenciales.
2. **Exploración Libre**: Consulta pública de los 6 EcoPuntos oficiales de Pamplona en mapa interactivo, catálogo de recompensas y ranking de líderes en tiempo real.

### 1️⃣ Flujo Presencial en el EcoPunto (Flujo Principal)
1. **Llegada del Ciudadano**: Abre su "Carnet Digital QR" en la app.
2. **Escaneo por el Gestor**: El Gestor escanea o busca la ID del QR en `/gestor/scan`.
3. **Pantalla de Pesaje Presencial**: La app abre automáticamente la pantalla de pesaje bloqueada para dicho ciudadano.
4. **Registro de Kilos en Báscula**: El Gestor ingresa los kilos reales pesados físicamente (ej. 2.5 kg PET, 3 kg Cartón).
5. **Aprobación Inmediata**: Al presionar **Aprobar Entrega**, la entrega queda aprobada al instante y los EcoPuntos se acreditan de inmediato al ciudadano.

### 2️⃣ Flujo de Pre-solicitud del Ciudadano (Opcional)
1. **Pre-solicitud**: El ciudadano selecciona el EcoPunto que visitará y estima sus materiales para generar un ticket en estado `⏳ PENDIENTE`.
2. **Bandeja del Gestor**: Al llegar al EcoPunto, el Gestor revisa la bandeja de entregas pendientes, confirma los kilos en báscula y aprueba la entrega.

---

## Documentación del Proyecto

| Documento | Descripción |
|---|---|
| [`Documento_BD_Normalizacion_EcoPuntos.md`](./Documento_BD_Normalizacion_EcoPuntos.md) | Diagrama ERD (Mermaid) + Normalización 1FN, 2FN, 3FN con las tablas del sistema |
| [`Plan_Implementacion_EcoPuntos_Pamplona_V3.docx`](./Plan_Implementacion_EcoPuntos_Pamplona_V3.docx) | Plan de implementación oficial V3 para la ciudad de Pamplona |
| [`Mockups_Planificacion_Interfaces_EcoPuntos_v2 (a).docx`](./Mockups_Planificacion_Interfaces_EcoPuntos_v2%20%28a%29.docx) | Especificación gráfica de interfaces, diagramas wireframe y diseño UX |
| [`Plan_Implementacion_EcoPuntos_Angular_FastAPI.md`](./Plan_Implementacion_EcoPuntos_Angular_FastAPI.md) | Documento de planeación técnica del stack Angular 18 + FastAPI |
| [`Plan_Migracion_EcoPuntos_Angular_FastAPI.md`](./Plan_Migracion_EcoPuntos_Angular_FastAPI.md) | Plan de migración tecnológica a la arquitectura actual |

---

## Guía de Ejecución Local

### Prerrequisitos
- **Node.js** v20+
- **Python** 3.11+
- **Docker Desktop** (opcional para PostgreSQL container)

### Paso 1 — Arranque Rápido con 1 Clic (Windows)
Ejecutar el archivo ejecutable en la raíz del proyecto:
```cmd
start.bat
```
*(Inicia automáticamente el servidor FastAPI en el puerto 3000 y la app Angular en el puerto 4200).*

---

### Paso 2 — Ejecución Manual Paso a Paso

#### Backend (FastAPI)
```bash
cd fastapi_backend

# 1. Crear e iniciar entorno virtual Python
python -m venv .venv
# En Windows PowerShell:
.venv\Scripts\Activate.ps1

# 2. Instalar dependencias
pip install -r requirements.txt

# 3. Sembrar datos de prueba iniciales (materiales, ecopuntos, usuarios, recompensas, entregas)
python seed_completo.py

# 4. Iniciar servidor de desarrollo
python -m uvicorn app.main:app --reload --port 3000
```

La **API REST** queda disponible en:
- Endpoints: `http://localhost:3000/api/...`
- **Swagger UI (Documentación interactiva):** `http://localhost:3000/docs`
- ReDoc: `http://localhost:3000/redoc`

#### Frontend (Angular)
```bash
cd frontend
npm install
npx ng serve --port 4200
```

Abrir en el navegador: **`http://localhost:4200`**

### Visualizar la Base de Datos Local
Para consultar el contenido de las tablas SQLite (`ecopuntos.db`), ejecuta desde la raíz:
```powershell
python ver_base_datos.py
```

---

## Ejecutar Pruebas Automatizadas

### Backend (Pytest)
```bash
cd fastapi_backend
python -m pytest
```

Resultados esperados: **15/15 Pruebas Pasadas (100%)**
```
tests/test_api.py::test_health_check PASSED                              [  6%]
tests/test_api.py::test_unauthorized_access_to_profile PASSED            [ 13%]
tests/test_api.py::test_public_ecopoints_list PASSED                     [ 20%]
tests/test_error_cases.py::test_error_401_unauthorized_without_token PASSED [ 26%]
tests/test_error_cases.py::test_error_403_forbidden_citizen_calling_admin_endpoint PASSED [ 33%]
tests/test_error_cases.py::test_error_422_invalid_payload_data PASSED    [ 40%]
tests/test_error_cases.py::test_error_404_nonexistent_resource PASSED    [ 46%]
tests/test_error_cases.py::test_error_insufficient_points_for_reward PASSED [ 53%]
tests/test_register.py::test_successful_registration PASSED               [ 60%]
tests/test_register.py::test_duplicate_email_registration_fails PASSED   [ 66%]
tests/test_register.py::test_short_password_registration_fails PASSED      [ 73%]
tests/test_register.py::test_invalid_email_registration_fails PASSED     [ 80%]
tests/test_system.py::test_full_system_flow PASSED                       [ 86%]
tests/test_unified_workflow.py::test_unified_workflow_in_person_gestor_delivery PASSED [ 93%]
tests/test_unified_workflow.py::test_unified_workflow_citizen_pre_solicitud_ticket PASSED [100%]

======================== 15 passed in 6.89s =========================
```

---

## Credenciales de Usuarios de Prueba

| Rol | Correo | Contraseña | Acceso |
|---|---|---|---|
| **Administrador** | `admin@ecopuntos.com` | `admin123` | CRUD de Ecopuntos, Materiales, Recompensas, Métricas, Crear Gestor |
| **Gestor de Punto** | `gestor@ecopuntos.com` | `gestor123` | Pesaje presencial en báscula, aprobación instantánea, escáner QR |
| **Ciudadano (1° Ranking)** | `ana@ecopuntos.com` | `eco123` | Registro/pre-solicitud, canje de premios, carnet QR, ranking |
| **Ciudadano (2° Ranking)** | `juan@ecopuntos.com` | `eco123` | Historial de entregas, catálogo de recompensas |
| **Modo Invitado** | *(Sin inicio de sesión)* | N/A | Acceso directo a Vistas Públicas (Ecopuntos, Premios, Ranking) |

---

## Puertos del Sistema

| Servicio | Puerto | URL |
|---|---|---|
| Frontend Angular | 4200 | `http://localhost:4200` |
| Backend FastAPI (API) | 3000 | `http://localhost:3000/api/` |
| FastAPI Swagger UI | 3000 | `http://localhost:3000/docs` |
| PostgreSQL / PostGIS | 5432 | `localhost:5432` (BD: `ecopuntos`, usuario: `postgres`) |

---

## Estructura del Proyecto

```
DESARROLLO DE LA APP DE DESARROLLO ORIENTADO A PLATAFORMAS/
├── frontend/                     ← Angular 18+ (Standalone Components)
│   └── src/app/
│       ├── core/
│       │   ├── models/           ← User, Delivery, EcoPoint, Material, Reward
│       │   ├── services/         ← AuthService, DeliveryService, EcoPointService,
│       │   │                        MaterialService, RewardService, AdminService, QrService
│       │   ├── interceptors/     ← AuthInterceptor (JWT), ErrorInterceptor
│       │   └── guards/           ← AuthGuard, RoleGuard
│       ├── shared/               ← NavbarComponent (Navegación dinámica por rol + Invitado)
│       └── features/             ← Admin (Metrics, Gestor, EcoPoints, Materials, Rewards),
│                                    Gestor (Scan), Citizen (QR), Dashboard, Deliveries,
│                                    EcoPoints Detail, Ranking, Rewards
├── fastapi_backend/              ← FastAPI + SQLAlchemy 2.0 + Pydantic v2
│   ├── app/
│   │   ├── main.py               ← App FastAPI, CORSMiddleware, routers
│   │   ├── config.py             ← Pydantic BaseSettings
│   │   ├── database.py           ← Motor SQLAlchemy con resiliencia SQLite
│   │   ├── security.py           ← passlib (bcrypt), python-jose (JWT), require_roles
│   │   ├── models/models.py      ← Modelos ORM relacionales
│   │   ├── schemas/schemas.py    ← DTOs / Schemas Pydantic v2
│   │   └── routers/              ← auth, ecopoints, materials, deliveries,
│   │                                rewards, ranking, admin, qr
│   ├── tests/                    ← Suite completa de 15 pruebas automatizadas
│   ├── requirements.txt          ← Dependencias Python con versiones
│   └── seed_completo.py          ← Inicialización DDL y sembrado de 6 EcoPuntos de Pamplona
├── ver_base_datos.py             ← Script para inspeccionar las tablas SQLite en consola
├── start.bat                     ← Script de arranque rápido (FastAPI + Angular)
├── Documento_BD_Normalizacion_EcoPuntos.md ← Normalización 1FN, 2FN, 3FN y ERD
├── Plan_Implementacion_EcoPuntos_Pamplona_V3.docx ← Plan de implementación oficial V3
├── Mockups_Planificacion_Interfaces_EcoPuntos_v2 (a).docx ← Diseños UX y wireframes
├── Plan_Implementacion_EcoPuntos_Angular_FastAPI.md
└── Plan_Migracion_EcoPuntos_Angular_FastAPI.md
```

