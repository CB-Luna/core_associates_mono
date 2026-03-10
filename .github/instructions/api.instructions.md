---
applyTo: "core-associates-api/**"
---

# API NestJS + Prisma — Instrucciones

## Estructura de módulos

```
modules/{nombre}/
├── {nombre}.module.ts
├── {nombre}.controller.ts
├── {nombre}.service.ts
└── dto/
    ├── create-{entidad}.dto.ts
    └── update-{entidad}.dto.ts
```

Archivos en **kebab-case español**: `casos-legales.controller.ts`, `create-caso-legal.dto.ts`.

Módulos existentes: `auth`, `asociados`, `vehiculos`, `documentos`, `proveedores`, `promociones`, `cupones`, `casos-legales`, `menu`, `reportes`, `storage`, `notificaciones` (stub).

## Auth dual

- **App móvil** (asociados): OTP por SMS → `POST /auth/otp/send` → `POST /auth/otp/verify` → JWT. Bypass dev: código `000000`.
- **CRM web** (usuarios): Email + password → `POST /auth/login` → JWT + refresh token.
- Access token: 15min, refresh: 7 días. Payload incluye `tipo: 'usuario' | 'asociado'`.

## Guards y decoradores — patrón estándar

```typescript
@UseGuards(JwtAuthGuard)           // Nivel clase → todo protegido
@Controller('asociados')
export class AsociadosController {
  @Get()
  @UseGuards(RolesGuard)            // Nivel método → roles específicos
  @Roles('admin', 'operador')
  findAll(@CurrentUser('id') userId: string) {}
}
```

- `@CurrentUser()` extrae user del request. `@CurrentUser('id')` extrae solo el id.
- `@Roles(...)` en `common/decorators/roles.decorator.ts`, `RolesGuard` en `common/guards/roles.guard.ts`.

## Paginación (uniforme en todos los services)

Todos los `findAll` retornan `{ data: T[], meta: { total, page, limit, totalPages } }`.
Heredan de `PaginationQueryDto` (`common/dto/pagination-query.dto.ts`) con `page`, `limit`, `search`.

```typescript
const skip = (page - 1) * limit;
const [data, total] = await Promise.all([
  this.prisma.modelo.findMany({ where, skip, take: limit, orderBy, include }),
  this.prisma.modelo.count({ where }),
]);
return { data, meta: { total, page, limit, totalPages: Math.ceil(total / limit) } };
```

## DTOs — class-validator + Swagger

ValidationPipe global (`main.ts`): `whitelist: true`, `forbidNonWhitelisted: true`, `transform: true`.

```typescript
export class CreateCasoLegalDto {
  @ApiProperty({ enum: ['accidente', 'infraccion', 'robo', 'asalto', 'otro'] })
  @IsEnum(['accidente', 'infraccion', 'robo', 'asalto', 'otro'])
  tipoPercance: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descripcion?: string;
}
```

Cada DTO documenta con `@ApiProperty()` / `@ApiPropertyOptional()`. Controllers usan `@ApiTags()`, `@ApiBearerAuth()`, `@ApiOperation()`.

## Archivos — MinIO via StorageService

- `StorageService` en `modules/storage/`: `uploadFile`, `getPresignedUrl` (15 min), `deleteFile`.
- Buckets: `core-associates-documents`, `core-associates-providers`, `core-associates-promotions`, `core-associates-legal`.
- Key path: `{asociadoId}/{tipo}/{timestamp}.{ext}`.
- Upload con `@UseInterceptors(FileInterceptor('file'))` + `@ApiConsumes('multipart/form-data')`.

## Prisma

- Schema en `prisma/schema.prisma`. 12 modelos con UUIDs.
- Mapeo camelCase (Prisma) → snake_case (BD) via `@map()` en campos y `@@map()` en tablas.
- `PrismaModule` es **global** — no necesita importarse en cada módulo.
- Errores Prisma: usar try/catch para `PrismaClientKnownRequestError` cuando sea relevante (ej. unique constraint).

## CORS

Configurado en `main.ts` con whitelist explícita:
```typescript
app.enableCors({
  origin: [
    'http://localhost:3600',              // Next.js CRM local
    'http://localhost:8580',              // Nginx Gateway local
    'http://216.250.125.239:8580',        // Nginx Gateway producción (HTTP)
    'https://core-asoc.cbluna-dev.com',   // Dominio producción (HTTPS)
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  credentials: true,
});
```

**Al desplegar en un nuevo dominio/IP**, agregar la URL pública a la lista `origin`. En producción, el CRM web usa rutas relativas vía Nginx (mismo origen), pero el CORS sigue necesario como capa de seguridad adicional.

**Dominio actual de producción**: `https://core-asoc.cbluna-dev.com` — SSL gestionado por Nginx Proxy Manager externo.

## Docker (`docker-entrypoint.sh`)

- Usa `npm ci` **sin** `--ignore-scripts` → necesario para compilar módulos nativos (`bcrypt`).
- Ejecuta `prisma migrate deploy` (solo aplica migraciones pendientes, no crea nuevas).
- Luego arranca con `npm run start:dev` (watch mode en target development).

## Swagger

URL: `http://localhost:3501/api/docs`. Prefijo global: `/api/v1`.

## Comandos desde la raíz del monorepo

No hay `package.json` raíz. Para ejecutar scripts de la API sin entrar a su carpeta, usar `--prefix`:

```bash
# Desde la raíz del monorepo (core-associates/)
npm run --prefix core-associates-api prisma:studio    # Prisma Studio → http://localhost:5555
npm run --prefix core-associates-api prisma:migrate   # Aplicar migraciones
npm run --prefix core-associates-api prisma:generate  # Regenerar Prisma Client
npm run --prefix core-associates-api prisma:seed      # Seed de datos
npm run --prefix core-associates-api start:dev        # API en watch mode
```

Requisito: el contenedor de PostgreSQL debe estar corriendo (`docker compose up postgres -d`) y el `.env` en `core-associates-api/.env` debe tener `DATABASE_URL` apuntando a `localhost:5435`.
