# Plan de trabajo: EcoPuntos Pamplona → Angular + FastAPI + PostgreSQL

Documento maestro del proceso de migracion tecnologica de EcoPuntos Pamplona. Guia la transicion del stack original (Vanilla JS + Express) al stack actual (Angular + FastAPI + PostgreSQL).

---

## 1. Contexto del Proyecto

- **Materia:** Desarrollo Orientado a Plataformas (Universidad de Pamplona).
- **Requerimientos tecnicos:** Angular + API REST (FastAPI / Django REST) + PostgreSQL.
- **Proyecto actual:** EcoPuntos Pamplona, desarrollado originalmente en Vanilla JS (PWA) + Node.js/Express + PostgreSQL 15 con PostGIS 3.3.
- **Objetivo de Migración:** Reescribir el Frontend en **Angular** (Componentes Standalone, Services, ReactiveForms, Guards, Interceptors) y el Backend en **FastAPI** (Python 3.11+, Pydantic v2, SQLAlchemy, JWT, OAuth2, Uvicorn), manteniendo la base de datos PostgreSQL/PostGIS.

---

## 2. Funcionalidades Implementadas por Modulo

| # | Modulo | Estado | Descripcion |
|---|---|---|---|
| 1 | **Mockups y planificacion** | Completo | Mockups para todas las vistas: login, registro, dashboards por rol, listas, detalles, formularios de creacion/edicion. |
| 2 | **Arquitectura y organizacion** | Completo | Modularizacion estricta: `frontend/` (Angular standalone, services, guards) y `fastapi_backend/` (routers, schemas, models). |
| 3 | **Desarrollo Frontend Angular** | Completo | Angular 22 CLI, standalone components, ReactiveForms, RxJS, HttpClient, Guards por rol e Interceptors JWT/Error. |
| 4 | **Backend y API REST (FastAPI)** | Completo | FastAPI + Pydantic v2. Endpoints GET, POST, PUT/PATCH, DELETE. Respuestas JSON estandarizadas y HTTP status codes correctos. |
| 5 | **Diseno y Diagrama BD** | Completo | Diagrama ER completo (Mermaid) especificando PK, FK, cardinalidades (1..N, N..N) y atributos de las 10 tablas. |
| 6 | **Normalizacion de tablas** | Completo | Explicacion detallada de 1FN, 2FN y 3FN aplicada a las tablas del sistema. |
| 7 | **Integracion Angular → API → PostgreSQL** | Completo | Comunicacion HTTP fluida entre capas con persistencia real en PostgreSQL. |
| 8 | **CRUD y reglas de negocio** | Completo | Operaciones CRUD completas para Ecopuntos, Materiales, Premios, Campanas y Entregas. Transacciones ACID. |
| 9 | **Autenticacion, roles y seguridad** | Completo | Autenticacion JWT, contrasenas hashed con `bcrypt`, tres roles diferenciados, Guards en Angular y dependencias en FastAPI. |
| 10 | **Ejecucion y despliegue local** | Completo | `docker-compose.yml` para PostgreSQL/PostGIS. README detallado con todos los comandos. |
| 11 | **Interfaz y UX** | Completo | Diseno UI moderno, responsive, retroalimentacion al usuario (toasts/alerts), estados de carga. |
| 12 | **Calidad del codigo y documentacion** | Completo | Clean Code, separacion de conceptos, docstrings en FastAPI y README paso a paso. |
| 13 | **Pruebas automatizadas** | Completo | Suite pytest + httpx: flujos normales y escenarios de error. |
| 14 | **Mejoras adicionales** | Completo | Geolocalizacion PostGIS para ecopuntos cercanos, escanер QR de entregas/canjes y soporte Docker. |

---

## 3. Estado de la Base de Datos y Endpoints

### 3.1. Tablas de PostgreSQL (10 Tablas)
- `users`: Usuarios (Ciudadano, Gestor_de_Punto, Administrador), saldo de puntos, nivel, datos de contacto.
- `ecopoints`: Puntos de reciclaje con geolocalización PostGIS (`geometry(Point, 4326)`), dirección, horario y gestor asignado.
- `materials`: Tipos de residuos aceptados, equivalencia de `points_per_kg` y `co2_kg_per_kg`.
- `deliveries`: Registro de entregas de reciclaje, usuario, ecopunto, estado (`pending`, `approved`, `rejected`), total puntos y CO₂.
- `delivery_items`: Detalle por material y peso en kg de cada entrega.
- `rewards`: Catálogo de recompensas canjeables, costo en puntos, stock disponible.
- `redeemed_rewards`: Historial de canjes realizados, código de redención único, fecha de canje.
- `campaigns`: Campañas ambientales con fechas de inicio/fin y meta de kg/puntos.
- `campaign_participants`: Tabla intermedia N..N entre usuarios y campañas.
- `notifications`: Notificaciones internas para los usuarios (alertas de aprobación, canje, campañas).

### 3.2. Mapeo REST de Recursos (CRUD Completo en FastAPI)

| Recurso | GET (Listar / Detalle) | POST (Crear) | PUT/PATCH (Actualizar) | DELETE (Eliminar) | Roles Autorizados |
|---|---|---|---|---|---|
| **Autenticación** | `GET /api/v1/auth/me` | `POST /register`, `POST /login` | `PATCH /profile` | - | Todos / Autenticado |
| **Ecopuntos** | `GET /ecopoints`, `GET /ecopoints/{id}`, `GET /ecopoints/nearby` | `POST /ecopoints` | `PUT /ecopoints/{id}` | `DELETE /ecopoints/{id}` | Publico (Lectura), Admin (Escritura) |
| **Materiales** | `GET /materials`, `GET /materials/{id}` | `POST /materials` | `PUT /materials/{id}` | `DELETE /materials/{id}` | Publico (Lectura), Admin (Escritura) |
| **Entregas** | `GET /deliveries/my`, `GET /deliveries/pending`, `GET /deliveries/{id}` | `POST /deliveries` | `PATCH /deliveries/{id}/approve`, `PATCH /deliveries/{id}/reject` | `DELETE /deliveries/{id}` (solo pending) | Ciudadano / Gestor / Admin |
| **Recompensas** | `GET /rewards`, `GET /rewards/{id}`, `GET /rewards/history/my` | `POST /rewards`, `POST /rewards/{id}/redeem` | `PUT /rewards/{id}` | `DELETE /rewards/{id}` | Publico (Lectura), Admin (Escritura), Ciudadano (Redeem) |
| **Campañas** | `GET /campaigns`, `GET /campaigns/{id}` | `POST /campaigns`, `POST /campaigns/{id}/join` | `PUT /campaigns/{id}` | `DELETE /campaigns/{id}` | Publico (Lectura), Ciudadano (Join), Admin (Escritura) |
| **Ranking** | `GET /ranking/top`, `GET /ranking/my-position` | - | - | - | Publico / Autenticado |
| **Notificaciones** | `GET /notifications/my` | - | `PATCH /notifications/{id}/read` | `DELETE /notifications/{id}` | Autenticado |

---

## 4. Fases de Ejecución del Proyecto

### Fase 1: Planificacion, Mockups, Diagrama ER y Normalizacion
1. **Mockups de Interfaz:** Diseñar o generar prototipos visuales claros para todas las pantallas principales (Login, Registro, Dashboard Ciudadano, Dashboard Gestor, Dashboard Admin, Mapa Interactivo, Formulario de Entrega, Catálogo de Premios, Ranking y CRUDs de administración).
2. **Diagrama ER:** Crear diagrama con notación limpia (Mermaid / Draw.io) indicando PK, FK, tipos de datos, relaciones 1..N y N..N.
3. **Documento de Normalización:**
   - **1FN:** Demostrar atomicidad en datos. `delivery_items` descompone entregas en líneas individuales sin repetitivos ni arrays de materiales.
   - **2FN:** Garantizar que todo atributo no clave dependa totalmente de la PK. Los valores de `points_per_kg` residen en `materials` y no se duplican en la orden.
   - **3FN:** Eliminar dependencias transitivas. Los atributos del Ecopunto (dirección, nombre) no residen en `deliveries`, sino que se vinculan vía `ecopoint_id`.
   - **Justificación de Entidades Derivadas:** Justificar el almacenamiento de `total_points` y `total_co2` como decisión explícita de desnormalización por rendimiento en lecturas frecuentes.

### Fase 2: Control de Versiones (Git) y Configuración Segura (+5 pts Bonus)
1. Inicializar repositorio Git local y remoto (GitHub/GitLab).
2. Configurar `.gitignore` para excluir `.env`, `.venv/`, `node_modules/`, `dist/`, `.angular/`.
3. Crear `.env.example` con las variables de configuración requeridas.
4. Implementar estructura de ramas: `main` (producción/entrega), `develop` (desarrollo), y ramas de característica `feature/angular-auth`, `feature/fastapi-crud`.
5. Commits limpios usando convención *Conventional Commits* (`feat: ...`, `fix: ...`, `docs: ...`).

### Fase 3: Desarrollo Frontend en Angular 17/18
1. **Estructura Modular (Standalone Components):**
   ```text
   frontend/src/app/
   ├── core/
   │   ├── guards/          # AuthGuard, RoleGuard
   │   ├── interceptors/    # AuthInterceptor (JWT Header), ErrorInterceptor (Handling 401/403/500)
   │   ├── models/          # TypeScript Interfaces (User, Ecopoint, Material, Delivery, Reward)
   │   └── services/        # AuthService, EcopointService, DeliveryService, RewardService, etc.
   ├── shared/              # Components (Navbar, Sidebar, Toast, LoadingSpinner, ConfirmationModal)
   └── features/
       ├── auth/            # Login, Register
       ├── dashboard/       # Views based on roles
       ├── ecopoints/       # Map (Leaflet) & CRUD
       ├── deliveries/      # New Delivery Form (ReactiveForms) & Pending Approvals
       ├── rewards/         # Catalog & Redemption History
       └── admin/           # Management Panels (Users, Materials, Campaigns)
   ```
2. **Validaciones en Formulario:** Uso intensivo de `ReactiveFormsModule` (`Validators.required`, `Validators.email`, `Validators.min(0.1)`).
3. **Manejo de UX:** Spinners activados por llamadas a la API, Toasts de notificación para éxitos o errores de HTTP, diseño 100% Responsive.

### Fase 4: Desarrollo Backend en FastAPI
1. **Estructura del Proyecto:**
   ```text
   backend/
   ├── app/
   │   ├── main.py          # App initialization, CORS, FastAPI routes
   │   ├── config.py        # Settings via Pydantic BaseSettings (.env loading)
   │   ├── database.py      # SQLAlchemy engine & SessionLocal
   │   ├── security.py      # Passlib bcrypt hashing, JWT token creation/decoding
   │   ├── models/          # SQLAlchemy ORM models
   │   ├── schemas/         # Pydantic v2 schemas (In, Out, Update)
   │   ├── routers/         # Endpoint modules (auth, ecopoints, deliveries, rewards, etc.)
   │   └── services/        # Business logic & ACID transactions
   ├── tests/               # Pytest integration tests
   ├── requirements.txt
   └── docker-compose.yml
   ```
2. **Seguridad JWT:** Extracción de token Bearer, función de dependencia `get_current_user` y `require_roles(["Administrador", "Gestor_de_Punto"])`.
3. **Manejo de Errores Standard:** Excepciones `HTTPException` con códigos adecuados (400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict, 422 Validation Error).

### Fase 5: Reglas de Negocio Complejas y Transacciones
1. **Cálculo Automático de Puntos y CO₂:** Al crear/aprobar entregas, multiplicar peso acumulado por factor de material.
2. **Aprobación de Entregas:** Transacción atómica que actualiza el estado de la entrega a `approved`, incrementa los puntos del ciudadano, suma su CO₂ ahorrado y recalcula su nivel.
3. **Canje de Recompensas (Transacción ACID):**
   - Verificar si el usuario tiene `saldo_puntos >= reward.points_cost`.
   - Verificar `reward.stock > 0`.
   - Restar puntos al usuario y decrementar el stock de la recompensa.
   - Generar `redemption_code` único (UUIDv4) y crear registro en `redeemed_rewards`.
   - Todo dentro de un bloque `db.commit()` protegido por `db.rollback()` en caso de excepción.

### Fase 6: Pruebas, Documentación y Ejecución Local
1. **Pruebas Automatizadas:** Implementar pruebas en `pytest` con `httpx` para:
   - Login correcto / incorrecto.
   - Creación y aprobación de entrega.
   - Canje de recompensa exitoso y error por saldo insuficiente.
   - Intentos de acceso no autorizados por rol (403 Forbidden).
2. **Documentación del Proyecto (README.md):**
   - Prerrequisitos (Node.js 20, Python 3.11, Docker Desktop).
   - Guía paso a paso para ejecutar la base de datos en Docker.
   - Comandos de migración y siembra de datos iniciales.
   - Comandos para ejecutar backend FastAPI (`uvicorn app.main:app --reload`).
   - Comandos para ejecutar frontend Angular (`ng serve`).
   - Credenciales de usuarios de prueba predeterminados.

### Fase 7: Sustentación y Demostración
- Dominio del código: Capacidad para explicar el flujo completo de una petición HTTP desde la interfaz de Angular, pasando por los interceptores, la ruta en FastAPI, las validaciones de Pydantic, la consulta SQLAlchemy/PostGIS y la respuesta JSON.
- Preparación para realizar pequeñas modificaciones en vivo que solicite el docente (ejemplo: agregar un filtro o cambiar un mensaje de validación).

### Fase 8: Despliegue en la Nube (+5 pts Bonus)
- Base de Datos: Instancia PostgreSQL en Supabase, Neon o Railway.
- Backend: Servicio Web en Render, Railway o Koyeb.
- Frontend: Hosting en Vercel, Netlify o Cloudflare Pages.
- Variables de entorno en producción y ajuste de políticas CORS.

---

## 5. Datos y Credenciales de Prueba

- **Administrador:** `9001` / `admin123`
- **Gestor de Punto:** `2002` / `gestor123`
- **Ciudadano:** `1001` / `eco123`
- **Puertos por defecto:**
  - Frontend Angular: `http://localhost:4200`
  - Backend FastAPI (Swagger Docs): `http://localhost:3000/docs`
  - PostgreSQL / PostGIS: `localhost:5432`
  - pgAdmin: `http://localhost:5050`
