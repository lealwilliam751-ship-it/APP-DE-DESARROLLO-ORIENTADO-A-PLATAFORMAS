# Guía de Sustentación y Defensa del Código: EcoPuntos Pamplona

Documento de preparación para responder preguntas del docente y realizar modificaciones en vivo durante la sustentación (**Criterios 13 - 8 pts y 14 - 3 pts**).

---

## 1. Explicación del Flujo de Datos End-to-End (Angular → FastAPI → PostgreSQL)

Cuando un usuario interactúa con la aplicación (por ejemplo, al iniciar sesión o enviar una entrega):

1. **Angular (Frontend):**
   - El usuario llena el formulario reactivo (`ReactiveFormsModule`).
   - El componente delega la petición al servicio especializado (`AuthService` o `DeliveryService`).
   - El `authInterceptor` intercepta la petición HTTP y adjunta automáticamente el token en el encabezado: `Authorization: Bearer <token>`.
   - Si la API responde con un error 401 o 403, el `errorInterceptor` captura el fallo de forma global.

2. **FastAPI (Backend):**
   - La petición ingresa a `app/main.py` pasando por el middleware de CORS.
   - Pydantic v2 (`app/schemas/schemas.py`) valida los tipos de datos de entrada. Si un campo falta o es inválido, retorna HTTP 422.
   - La función de dependencia `get_current_user` decodifica el token JWT en `app/security.py` usando `HS256` y `JWT_SECRET`.
   - La dependencia `require_roles([UserRole.Administrador])` verifica que el usuario tenga el rol autorizado en la base de datos.
   - SQLAlchemy ejecuta la transacción ACID sobre PostgreSQL (`db.commit()`, `db.rollback()` en caso de error).

3. **PostgreSQL (Base de Datos):**
   - Se ejecutan las sentencias SQL parametrizadas y seguras contra las tablas correspondientes.

---

## 2. Preguntas Frecuentes de Sustentación y Respuestas Clave

### Q1: "¿Dónde y cómo se protegen los endpoints y las rutas?"
- **En Angular:** En `app.routes.ts` usando `canActivate: [authGuard]` y `canActivate: [roleGuard]`.
- **En FastAPI:** En los routers usando inyección de dependencias `current_user: User = Depends(get_current_user)` o `Depends(require_roles([UserRole.Administrador]))`.

### Q2: "¿Cómo garantizan la integridad de los canjes de puntos (Transacciones ACID)?"
- En `app/routers/rewards.py`, dentro de un bloque `try...except`, se descuentan los puntos al usuario, se decrementa el stock de la recompensa y se genera el código único `ECO-XXXXXXXX`. Si alguna operación falla, se invoca `db.rollback()`, evitando inconsistencias.

### Q3: "¿Cómo se calcula la distancia a los Ecopuntos cercanos?"
- En `app/routers/ecopoints.py` se utiliza la fórmula matemática de **Haversine** para calcular la distancia en kilómetros a partir de latitud y longitud, y en PostgreSQL se cuenta con el índice espacial GIST sobre `geometry(Point, 4326)` con PostGIS.

---

## 3. Posibles Modificaciones en Vivo para la Demostración

Si el docente pide realizar un cambio en vivo durante la sustentación:

1. **Modificación A: Cambiar la cantidad de puntos por kilo de un material:**
   - *Ruta:* Editar en `fastapi_backend/app/routers/materials.py` o cambiar en la tabla `materials` mediante el endpoint `PUT /api/materials/{id}`.

2. **Modificación B: Agregar una validación al formulario de registro:**
   - *Ruta:* Editar en `frontend/src/app/features/auth/register/register.component.ts` en `registerForm` agregando `Validators.minLength(X)`.

3. **Modificación C: Modificar el cálculo de nivel del usuario:**
   - *Ruta:* Editar la función `calculate_level(points)` en `fastapi_backend/app/routers/deliveries.py`.
