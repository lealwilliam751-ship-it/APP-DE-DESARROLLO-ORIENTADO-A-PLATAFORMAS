# EcoPuntos Pamplona
## Sistema de Incentivos de Reciclaje
### Documento de Planeación e Implementación Actualizado
**Stack tecnologico actual:** Angular 22 (Frontend) + FastAPI 0.142 (Backend REST) + PostgreSQL 15 / PostGIS 3.3 (Base de Datos)

---

## 2. Stack Tecnologico

| Capa | Tecnologia | Descripcion |
|---|---|---|
| **Frontend** | Angular 22 (Standalone Components) | Arquitectura modular, tipado estatico TypeScript, formularios reactivos, interceptores HTTP e inyeccion de dependencias. |
| **Backend** | FastAPI 0.142 (Python 3.13) | Genera automaticamente documentacion interactiva en `/docs`, valida entradas con Pydantic v2, maneja JWT con `python-jose`. |
| **Base de Datos** | PostgreSQL 15 + PostGIS 3.3 | Esquema relacional normalizado con soporte espacial PostGIS. Gestionado via Docker. |
| **ORM** | SQLAlchemy 2.1 | Consultas parametrizadas seguras, soporte de transacciones ACID. |
| **Autenticacion** | JWT con `python-jose` + bcrypt | Tokens firmados HS256 con expiracion de 24h. Contrasenas hashed con bcrypt. |
| **Contenedores** | Docker + docker-compose | Base de datos y pgAdmin levantados con un solo comando. |

---

## 3. Modulos del Sistema

| Modulo | Descripcion | Estado |
|---|---|---|
| **Ecopuntos y Geolocalizacion** | Registro, consulta y busqueda de ecopuntos por proximidad (Haversine o PostGIS `ST_DWithin`). CRUD completo para Administrador. | Implementado |
| **Materiales Reciclables** | Catalogo de residuos con factor de puntos/kg y CO2/kg. CRUD completo para Administrador. | Implementado |
| **Entregas con QR y Bascula** | Flujo presencial: QR personal del Ciudadano, escaner del Gestor, registro de peso por material en formulario reactivo Angular. | Implementado |
| **Motor de Puntos e Impacto** | Calculo automatico de puntos y CO2 en transaccion ACID al aprobar entregas. Recalculo de nivel del ciudadano. | Implementado |
| **Recompensas y Cupones** | Catalogo de premios, canje de puntos con verificacion de stock, generacion de codigo unico `ECO-XXXXXXXX`. | Implementado |
| **Campanas Ecologicas** | Iniciativas comunitarias con metas colectivas de reciclaje y control de fechas. | Esquema BD listo |
| **Ranking Ciudadano** | Tabla de lideres (TOP ciudadanos por puntos), posicion personal del usuario autenticado. | Implementado |
| **Panel Administrativo** | Metricas ejecutivas: total usuarios, entregas aprobadas, puntos circulantes y CO2 total. Gestion de Gestores de Punto. | Implementado |
| **Notificaciones** | Alertas internas para ciudadanos (aprobacion de entregas, canjes, campanas). | Esquema BD listo |

---

## 4. Arquitectura del Sistema

### 4.1. Diagrama de Capas

```
+----------------------------+      HTTP/REST (Puerto 4200)
| Angular 22 (Frontend) | 
| Standalone Components | 
| TypeScript + RxJS | 
| ReactiveForms + Guards | +----------------------------------+ 
| HTTP Interceptors | | FastAPI 0.142 (Backend REST) | 
+----------------------------+ | Python 3.13 + Uvicorn | 
                                    | Pydantic v2 + SQLAlchemy 2.1 | 
                                    | JWT (python-jose) + bcrypt | 
                                    | Puerto: 3000 | 
                                    | Swagger UI: /docs | 
                                    +----------------------------------+ 
                                                     
                                                     
                                    +----------------------------------+ 
                                    | PostgreSQL 15 + PostGIS 3.3 | 
                                    | (Docker, Puerto 5432) | 
                                    | 10 tablas normalizadas | 
                                    | Índice espacial GIST | 
                                    +----------------------------------+ 
```

### 4.2. Estructura de Directorios

```
PROYECTO ECOPUNTOS PAMPLONA/
 frontend/ ← Angular 22
 src/app/
 core/
 models/ ← Interfaces TypeScript
 services/ ← AuthService, DeliveryService, etc.
 interceptors/ ← AuthInterceptor (JWT), ErrorInterceptor
 guards/ ← AuthGuard, RoleGuard
 shared/ ← NavbarComponent, componentes reutilizables
 features/
 auth/ ← LoginComponent, RegisterComponent
 dashboard/ ← Panel por rol (Ciudadano/Gestor/Admin)
 ecopoints/ ← Lista de ecopuntos
 deliveries/ ← Formulario ReactiveForm con FormArray
 rewards/ ← Catálogo y canje de premios
 ranking/ ← Tabla de clasificación
 fastapi_backend/ ← FastAPI + SQLAlchemy
 app/
 main.py ← App, CORS, routers registrados
 config.py ← Pydantic Settings (.env)
 database.py ← SQLAlchemy engine + SessionLocal
 security.py ← bcrypt, JWT, get_current_user, require_roles
 models/models.py ← ORM SQLAlchemy (10 tablas)
 schemas/schemas.py ← Pydantic v2 In/Out schemas
 routers/ ← auth, ecopoints, materials, deliveries,
 rewards, ranking, admin, qr
 tests/
 test_api.py ← Pruebas básicas (health, auth, endpoints)
 test_system.py ← Suite integral de 8 flujos del sistema
 seed.py ← Semilla de datos iniciales
 backend/ ← Sistema original Express (referencia)
 migrations/ ← Esquema SQL original (reutilizado)
 docker-compose.yml ← PostgreSQL 15 + PostGIS + pgAdmin
 README.md ← Guía de ejecución local completa
```

---

## 5. Modelo de Datos (10 Tablas Normalizadas)

```
users         (id PK, name, email, password_hash, role ENUM, default_city,
               total_points, level, created_at, updated_at)
ecopoints     (id PK, name, address, city, lat, lng, location GEOMETRY(Point,4326),
               created_at)
materials     (id PK, name, points_per_kg, co2_kg_per_kg)
deliveries    (id PK, user_id FK→users, ecopoint_id FK→ecopoints,
               status ENUM('pending','approved','rejected'), total_points,
               total_co2, created_at, updated_at)
delivery_items(id PK, delivery_id FK→deliveries, material_id FK→materials,
               weight_kg, points, co2_saved)
rewards       (id PK, name, description, category, point_cost, stock, created_at)
redeemed_rewards (id PK, user_id FK→users, reward_id FK→rewards, points_spent,
               redemption_code UNIQUE, redeemed_at)
campaigns     (id PK, name, description, start_date, end_date, goal_points,
               current_points, status ENUM, created_at)
campaign_participants (id PK, campaign_id FK→campaigns, user_id FK→users,
               points_contributed, joined_at,
               UNIQUE(campaign_id, user_id))
notifications (id PK, user_id FK→users, title, message, is_read BOOL, created_at)
```

### Relaciones Clave
- **1..N:** `users → deliveries`, `ecopoints → deliveries`, `deliveries → delivery_items`, `materials → delivery_items`, `users → redeemed_rewards`, `users → notifications`
- **N..N:** `campaigns users` a través de `campaign_participants`

---

## 6. API REST (FastAPI — Endpoints Implementados)

| Método | Endpoint | Rol | Descripción |
|---|---|---|---|
| POST | `/api/auth/register` | Público | Registro de ciudadano |
| POST | `/api/auth/login` | Público | Login (email o documento) |
| GET | `/api/auth/profile` | Autenticado | Perfil y saldo de puntos |
| GET | `/api/ecopoints` | Público | Lista de ecopuntos |
| GET | `/api/ecopoints/nearby` | Público | Búsqueda por proximidad |
| GET | `/api/ecopoints/{id}` | Público | Detalle de ecopunto |
| POST | `/api/ecopoints` | Admin | Crear ecopunto |
| PUT | `/api/ecopoints/{id}` | Admin | Actualizar ecopunto |
| DELETE | `/api/ecopoints/{id}` | Admin | Eliminar ecopunto |
| GET | `/api/materials` | Público | Catálogo de materiales |
| POST | `/api/materials` | Admin | Crear material |
| PUT | `/api/materials/{id}` | Admin | Actualizar material |
| DELETE | `/api/materials/{id}` | Admin | Eliminar material |
| GET | `/api/deliveries/my` | Ciudadano | Mis entregas |
| GET | `/api/deliveries/pending` | Gestor/Admin | Entregas pendientes |
| POST | `/api/deliveries` | Ciudadano | Registrar entrega |
| PATCH | `/api/deliveries/{id}/approve` | Gestor/Admin | Aprobar entrega |
| PATCH | `/api/deliveries/{id}/reject` | Gestor/Admin | Rechazar entrega |
| DELETE | `/api/deliveries/{id}` | Ciudadano | Cancelar entrega pendiente |
| GET | `/api/rewards` | Público | Catálogo de recompensas |
| POST | `/api/rewards/{id}/redeem` | Ciudadano | Canjear recompensa |
| GET | `/api/rewards/history` | Ciudadano | Historial de canjes |
| POST | `/api/rewards` | Admin | Crear recompensa |
| PUT | `/api/rewards/{id}` | Admin | Actualizar recompensa |
| DELETE | `/api/rewards/{id}` | Admin | Eliminar recompensa |
| GET | `/api/ranking` | Público | Top ciudadanos |
| GET | `/api/ranking/me` | Ciudadano | Mi posición en ranking |
| GET | `/api/qr/generate` | Ciudadano | Generar mi código QR |
| POST | `/api/qr/scan` | Gestor/Admin | Escanear QR de ciudadano |
| POST | `/api/admin/create-gestor` | Admin | Crear/promover Gestor de Punto |
| GET | `/api/admin/metrics` | Admin | Métricas ejecutivas globales |
| GET | `/health` | Público | Estado del servidor |

---

## 7. Roles de Usuario

| Rol | Descripción | Permisos Principales |
|---|---|---|
| **Administrador** | Gestor ejecutivo de la plataforma | CRUD completo de Ecopuntos, Materiales, Recompensas y Campañas; Métricas globales; Gestión de Gestores de Punto. |
| **Gestor_de_Punto** | Operador presencial en centros de acopio | Escáner QR de ciudadano, registro y aprobación/rechazo de entregas. |
| **Ciudadano** | Usuario registrado que recicla | Registro de entregas, consulta de saldo y CO₂ evitado, QR personal, canje de cupones, seguimiento en ranking. |
| **Invitado** | Visitante no autenticado | Visualización del mapa de ecopuntos, campañas activas y ranking público. |

---

## 8. Seguridad Implementada

| Mecanismo | Implementación |
|---|---|
| **Hashing de contraseñas** | `bcrypt` (Python, compatible con hashes Node.js anteriores) |
| **Tokens de autenticación** | JWT firmado con `HS256` (expira en 24 h), clave en `.env` |
| **Autorización por rol** | Dependencia FastAPI `require_roles([UserRole.Administrador])` |
| **Protección en Angular** | `AuthGuard` (rutas privadas) + `RoleGuard` (rutas por rol) |
| **Inyección SQL** | Prevenida mediante consultas parametrizadas de SQLAlchemy |
| **CORS** | Configurado para `http://localhost:4200` en desarrollo |
| **Secretos** | Nunca en el código; siempre en `.env` (excluido de Git) |

---

## 9. Fases de Implementación Realizadas

| Fase | Nombre | Estado | Descripción |
|---|---|---|---|
| 0 | Definición y diseño | Completo | Requisitos, roles, modelo relacional y arquitectura |
| 1 | Base del sistema y autenticación | Completo | Docker, BD PostgreSQL, FastAPI JWT y register/login |
| 2 | Catálogos base y geolocalización | Completo | Ecopuntos con Haversine, catálogo de materiales |
| 3 | Entregas, QR y motor de puntos | Completo | Entrega con FormArray, aprobación con transacción ACID |
| 4 | Recompensas y cupones | Completo | Canje con validación ACID, código único ECO-XXXXXX |
| 5 | Angular — Componentes y Rutas | Completo | Todos los componentes Standalone, Guards, Interceptores |
| 6 | Ranking y panel ejecutivo | Completo | Leaderboard, posición personal, métricas de Admin |
| 7 | Pruebas automatizadas | Completo | Suite pytest: 4 tests (3 unitarios + 1 integral de 8 flujos) |
| 8 | Documentación oficial | Completo | ERD, Normalización, Mockups, Guía de Sustentación, README |
| 9 | Despliegue en nube | Opcional | +5 pts bonus (Vercel + Render + Supabase/Neon) |

---

## 10. Credenciales de Prueba y Puertos

| Rol | Documento / Correo | Contraseña |
|---|---|---|
| Administrador | `9001` / `admin@ecopuntos.com` | `admin123` |
| Gestor de Punto | `2002` / `gestor@ecopuntos.com` | `gestor123` |
| Ciudadano | `1001` / `eco@ecopuntos.com` | `eco123` |

| Servicio | Puerto | URL |
|---|---|---|
| Frontend Angular | 4200 | `http://localhost:4200` |
| Backend FastAPI (Swagger UI) | 3000 | `http://localhost:3000/docs` |
| PostgreSQL / PostGIS | 5432 | `localhost:5432` |
| pgAdmin | 5050 | `http://localhost:5050` |

---

## 11. Guía Rápida de Ejecución Local

```bash
# 1. Levantar la base de datos
docker-compose up -d

# 2. Sembrar datos iniciales
cd fastapi_backend
python seed.py

# 3. Iniciar Backend FastAPI
python -m uvicorn app.main:app --reload --port 3000

# 4. (Otra consola) Iniciar Frontend Angular
cd frontend
npx ng serve --port 4200
```

---

## 12. Mejoras Adicionales (Valor Agregado)

| Mejora | Descripción |
|---|---|
| **Búsqueda geoespacial** | Algoritmo Haversine para búsqueda de ecopuntos cercanos por radio en km (fallback de PostGIS) |
| **Flujo QR completo** | Generación de QR personal del ciudadano y escaneo por el Gestor en tiempo real |
| **Pruebas automatizadas** | Suite integral `pytest` que replica los 8 flujos funcionales del sistema original |
| **Docker Compose** | Entorno de base de datos listo para levantar con 1 solo comando |
| **Documentación Swagger** | Auto-generada por FastAPI en `http://localhost:3000/docs` sin configuración adicional |
| **Niveles dinámicos** | Recalculo automático del nivel ecológico del ciudadano al aprobar cada entrega |
