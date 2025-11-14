# Clean Orders TS

Servicio de ejemplo en TypeScript con arquitectura limpia para gestionar pedidos (Orders), usando Fastify. Permite ejecutar con repositorio en memoria (por defecto) o con PostgreSQL (Docker + migraciones). Incluye tests con Vitest, logging con Pino y un worker para el patrón Outbox.

## Requisitos
- Node.js 18+ (recomendado 20+)
- Docker y Docker Compose (solo si usas PostgreSQL)

## Instalación
```bash
npm install
```

## Ejecución rápida (BD en memoria)
La configuración por defecto no requiere base de datos.
```bash
npm run dev
```
- Servidor: `http://localhost:3000`
- Health check: `GET /health`

## Ejecutar con PostgreSQL
1) Crea un archivo `.env` en la raíz con:
```env
NODE_ENV=development
PORT=3000
DATABASE_TYPE=postgres
DATABASE_URL=postgres://postgres:postgres@localhost:5432/orders
LOG_LEVEL=info
LOG_PRETTY=true
OUTBOX_WORKER_INTERVAL_MS=1000
```

2) Levanta Postgres con Docker:
```bash
npm run db:up
```

3) Ejecuta migraciones:
```bash
npm run db:migrate
```

4) Inicia la aplicación:
```bash
npm run dev
```

Para parar y limpiar servicios:
```bash
npm run db:down
```

## Scripts disponibles
- `npm run dev`: levanta el servidor (`main.ts`) con `tsx`.
- `npm run db:up`: arranca Postgres con Docker Compose.
- `npm run db:down`: detiene y limpia los servicios de Docker Compose.
- `npm run db:migrate`: ejecuta migraciones SQL desde `db/migrations` (registro en tabla `migrations`).
- `npm run worker:outbox`: ejecuta el dispatcher de Outbox para publicar eventos pendientes.
- `npm test`: ejecuta los tests con Vitest.
- `npm run test:watch`: tests en modo watch.

## Variables de entorno
Gestionadas y validadas en `src/composition/config.ts` (zod):
- `NODE_ENV` (default: `development`): `development | production | test`.
- `PORT` (default: `3000`).
- `DATABASE_TYPE` (default: `memory`): `memory | postgres`.
- `DATABASE_URL` (requerida si `DATABASE_TYPE=postgres`).
- `LOG_LEVEL` (default: `info`): `trace|debug|info|warn|error|fatal`.
- `LOG_PRETTY` (default: `true`): `true|false`.
- `OUTBOX_WORKER_INTERVAL_MS` (default: `1000`).

## Endpoints HTTP
Base URL: `http://localhost:3000`

- Health check
  - `GET /health`
  - Respuesta: `{ "status": "ok", "timestamp": "..." }`

- Crear pedido
  - `POST /orders`
  - Body JSON:
    ```json
    { "orderSku": "ORDER-123" }
    ```
  - Respuestas: `201 Created` o error de validación/conflicto.

- Añadir ítem a pedido
  - `POST /orders/:orderSku/items`
  - Body JSON:
    ```json
    { "productSku": "SKU-001", "quantity": 2 }
    ```
  - Respuestas: `200 OK` o error.

### Ejemplos cURL
```bash
# Health
curl -s http://localhost:3000/health | jq

# Crear pedido
curl -s -X POST http://localhost:3000/orders \
  -H 'Content-Type: application/json' \
  -d '{"orderSku":"ORDER-123"}' | jq

# Añadir ítem
curl -s -X POST http://localhost:3000/orders/ORDER-123/items \
  -H 'Content-Type: application/json' \
  -d '{"productSku":"SKU-001","quantity":2}' | jq
```

## Migraciones
- Script: `scripts/migrate.ts` (ESM + `tsx`).
- Aplica archivos de `db/migrations/` de forma transaccional y registra los ejecutados en la tabla `migrations`.
- Ejecución: `npm run db:migrate` (requiere `DATABASE_TYPE=postgres` y `DATABASE_URL`).

## Worker Outbox
- Script: `npm run worker:outbox`.
- Publica eventos almacenados en la outbox. Útil cuando usas PostgreSQL y mensajería.

## Tests
```bash
npm test
# o en modo watch
npm run test:watch
```

## Estructura relevante
- `main.ts`: bootstrap del servidor y ciclo de vida.
- `src/infrastructure/http/server.ts`: configuración de Fastify y rutas.
- `src/infrastructure/http/controllers/order-controller.ts`: endpoints de Orders.
- `src/composition/`: contenedores DI y configuración.
- `src/application/`: casos de uso, DTOs y puertos.
- `src/domain/`: entidades, VOs y eventos de dominio.
- `db/migrations/`: migraciones SQL (p.ej. `001_init.sql`).
- `tests/`: pruebas unitarias, de integración y aceptación.

## Solución de problemas
- Error: "DATABASE_URL is required when DATABASE_TYPE is 'postgres'"
  - Define `DATABASE_URL` o cambia `DATABASE_TYPE=memory` para desarrollo sin BD.
- Migraciones fallan
  - Verifica que Postgres esté arriba (`npm run db:up`) y que la URL sea correcta.
- Puerto en uso
  - Cambia `PORT` en `.env`.

---

Hecho con Fastify, TypeScript, Vitest y Pino.