# EcoPuntos Pamplona: Plataforma de Reciclaje y Recompensas (Angular + FastAPI + PostgreSQL)

Plataforma integral web desarrollada para el curso **Desarrollo Orientado a Plataformas (Universidad de Pamplona)**.

---

## 📋 Arquitectura del Proyecto

- **Frontend:** Angular 22 (Standalone Components, RxJS, ReactiveForms, HTTP Interceptors, Guards por Rol).
- **Backend:** FastAPI 0.142+ (Python 3.13, Pydantic v2, SQLAlchemy, JWT Authentication, Pytest).
- **Base de Datos:** PostgreSQL 15 con extensión geoespacial PostGIS 3.3 (Dockerized).

---

## 🛠️ Prerrequisitos

- **Node.js:** v20.0.0 o superior
- **Python:** v3.11 o superior
- **Docker Desktop:** Activo para la base de datos PostgreSQL/PostGIS.

---

## 🚀 Guía de Ejecución Paso a Paso

### Paso 1: Iniciar Base de Datos en Docker
En la raíz del proyecto, ejecuta:
```bash
docker-compose up -d
```
> La base de datos estará disponible en `localhost:5432` (Usuario: `postgres`, Password: `postgres`, BD: `ecopuntos`). pgAdmin estará en `http://localhost:5050`.

### Paso 2: Ejecutar Backend FastAPI
1. Navega a la carpeta del backend:
   ```bash
   cd fastapi_backend
   ```
2. Inicia el servidor de desarrollo Uvicorn:
   ```bash
   python -m uvicorn app.main:app --reload --port 3000
   ```
> La API REST estará en `http://localhost:3000/api` y la documentación interactiva Swagger UI en `http://localhost:3000/docs`.

### Paso 3: Ejecutar Frontend Angular
1. En otra consola, navega a la carpeta del frontend:
   ```bash
   cd frontend
   ```
2. Inicia el servidor de desarrollo de Angular:
   ```bash
   npx ng serve --port 4200
   ```
> Abre tu navegador en `http://localhost:4200`.

---

## 🧪 Ejecutar Pruebas Automatizadas (Pytest)

Para verificar el correcto funcionamiento de los endpoints y autenticación:
```bash
cd fastapi_backend
python -m pytest tests/
```

---

## 🔑 Credenciales de Usuarios de Prueba

| Rol | Documento / Correo | Contraseña | Acceso y Permisos |
|---|---|---|---|
| **Administrador** | `9001` | `admin123` | Gestión total de Ecopuntos, Materiales, Recompensas y Usuarios. |
| **Gestor de Punto** | `2002` | `gestor123` | Validación y aprobación/rechazo de entregas pendientes. |
| **Ciudadano** | `1001` | `eco123` | Registro de entregas, consulta de saldo, canje de premios y ranking. |

---

## 📑 Documentación Técnica Obligatoria

- [`Plan_Migracion_EcoPuntos_Angular_FastAPI.md`](./Plan_Migracion_EcoPuntos_Angular_FastAPI.md): Plan de trabajo y mapeo de rúbrica.
- [`Documento_BD_Normalizacion_EcoPuntos.md`](./Documento_BD_Normalizacion_EcoPuntos.md): Diagrama ERD en sintaxis Mermaid y justificación de 1FN, 2FN, 3FN y transacciones ACID.
