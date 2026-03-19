# Análisis: IA Bilateral para Validación de Documentos KYC

> **Fecha**: 18 de marzo de 2026  
> **Contexto**: La IA de análisis documental debe operar en **dos frentes**: App Móvil (pre-validación antes de subir) y CRM Web (análisis profundo post-carga). Incluye anti-troll, notificaciones, y restricción funcional por estado KYC.

---

## 1. Arquitectura Propuesta — Doble Capa de IA

```
┌─────────────────────────────────────────────────────────────────┐
│                    CAPA 1: APP MÓVIL (Pre-filtro)               │
│                                                                 │
│  Usuario selecciona "INE Frente" → toma/elige foto              │
│       ↓                                                         │
│  POST /documentos/pre-validar  (envía imagen + tipo esperado)   │
│       ↓                                                         │
│  IA analiza en el backend:                                      │
│   • ¿La imagen corresponde al tipo? (INE vs paisaje vs meme)   │
│   • ¿Es legible? (no borrosa, no oscura, no cortada)           │
│   • ¿Cumple requisitos mínimos?                                ││       ↓                                                         │
│  Respuesta rápida (3-8 seg):                                    │
│   ✅ aprobada → se sube a MinIO → aparece en CRM               │
│   ❌ rechazada → se muestra motivo → NO se sube                │
│   ⚠️  advertencia → se permite subir con nota                  │
│                                                                 │
│  Contador de intentos: máx N rechazos por tipo por periodo      │
└─────────────────────────────────────────────────────────────────┘
                            ↓ (si aprobada)
┌─────────────────────────────────────────────────────────────────┐
│                 CAPA 2: CRM / BACKEND (Análisis profundo)       │
│                                                                 │
│  Documento llega a MinIO → fire-and-forget AI analysis          │
│       ↓                                                         │
│  IA extrae datos detallados:                                    │
│   • Nombre, CURP, vigencia, placas, VIN, etc.                  │
│   • Validaciones cruzadas (formato CURP, vigencia INE)          │
│   • Nivel de confianza por campo                                │
│       ↓                                                         │
│  Resultado disponible para operador en CRM:                     │
│   • Auto-aprobación si confianza ≥ 90% en TODOS los campos     │
│   • Revisión manual si confianza < 90% en algún campo           │
│   • Rechazo automático si validaciones críticas fallan           │
│       ↓                                                         │
│  Operador puede: Ver análisis, aprobar, rechazar, re-analizar   │
│  Admin puede: Subir documentos en nombre de un asociado         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. CAPA 1 — Pre-validación en App Móvil

### 2.1 Nuevo Endpoint: `POST /documentos/pre-validar`

**Flujo**: La app envía la imagen al backend ANTES de subirla a MinIO. El backend la pasa a la IA con un prompt ligero de clasificación/validación. Según el resultado, permite o bloquea la subida.

**¿Por qué en el backend y no on-device?**
- Los modelos on-device (TFLite, CoreML) requieren entrenamiento custom con dataset de INEs, selfies, etc.
- Claude Vision ya sabe reconocer documentos de identidad sin entrenamiento adicional.
- Mantiene un solo proveedor de IA (Anthropic) centralizado.
- Permite cambiar modelo/prompt sin actualizar la app.

**Endpoint propuesto:**

```typescript
// documentos.controller.ts
@Post('pre-validar')
@ApiOperation({ summary: 'Pre-validar imagen antes de subir (app)' })
@UseInterceptors(FileInterceptor('file'))
async preValidate(
  @CurrentUser('id') asociadoId: string,
  @UploadedFile(...) file: Express.Multer.File,
  @Body() dto: PreValidateDocumentDto,  // { tipo: 'ine_frente' | ... }
): Promise<PreValidationResult> {
  return this.documentosService.preValidateDocument(asociadoId, file, dto.tipo);
}
```

**Respuesta:**

```typescript
interface PreValidationResult {
  aprobada: boolean;           // true = puede subir, false = rechazada
  advertencia: boolean;        // true = subir pero con nota (calidad baja)
  motivo: string;              // "La imagen no corresponde a una INE"
  sugerencia: string;          // "Asegúrate de fotografiar solo el frente de tu INE"
  confianza: number;           // 0.0-1.0
  intentosRestantes: number;   // Cuántos intentos le quedan en este periodo
  bloqueado: boolean;          // true si ya excedió el límite de intentos
}
```

### 2.2 Prompt de Pre-validación (Ligero y Rápido)

A diferencia del análisis profundo (que extrae CURP, nombre, etc.), este prompt solo clasifica y valida calidad:

```typescript
// prompts/pre-validation-prompt.ts
export const PRE_VALIDATION_PROMPT = (tipoEsperado: string) => `
Eres un validador de documentos. El usuario intenta subir una imagen que supuestamente es: "${tipoLegible(tipoEsperado)}".

Analiza la imagen y responde SOLO con JSON:
{
  "es_tipo_correcto": boolean,      // ¿La imagen es realmente del tipo indicado?
  "es_legible": boolean,            // ¿Se puede leer/ver claramente?
  "calidad": "buena" | "aceptable" | "mala",
  "motivo_rechazo": string | null,  // Si es_tipo_correcto=false o es_legible=false
  "sugerencia": string | null,      // Consejo para mejorar la foto
  "confianza": number               // 0.0-1.0
}

Criterios por tipo:
- ine_frente: Debe mostrar el frente de una credencial INE/IFE mexicana con foto visible
- ine_reverso: Debe mostrar el reverso de una credencial INE/IFE con código de barras/QR
- selfie: Debe ser una foto tipo selfie de una persona real (no foto de foto)
- tarjeta_circulacion: Debe ser una tarjeta de circulación vehicular mexicana

Si la imagen es claramente algo diferente (paisaje, meme, objeto, etc.), rechaza con motivo claro.
Si la imagen es del tipo correcto pero borrosa/oscura/cortada, marca calidad "mala" y sugiere.
`;
```

### 2.3 Flujo en la App Flutter

```
Usuario toca "INE Frente" → cámara/galería → preview
   ↓
"Enviar" → POST /documentos/pre-validar (con loading "Verificando imagen...")
   ↓
┌── aprobada=true, advertencia=false → POST /documentos/upload → éxito ✅
├── aprobada=true, advertencia=true → Dialog: "La calidad es baja, ¿enviar de todos modos?"
│      ├── Sí → POST /documentos/upload
│      └── No → volver a capturar
├── aprobada=false → Dialog con motivo + sugerencia → volver a capturar
│      (incrementa contador de intentos fallidos)
└── bloqueado=true → Dialog: "Has excedido el límite de intentos. Intenta más tarde."
```

**Cambios en `documents_screen.dart`:**
- Después del preview y antes del upload, insertar llamada a `preValidate`.
- Nuevo método en `DocumentsRepository`: `preValidateDocument(filePath, tipo)`.
- UI: spinner con texto "Verificando documento..." durante la pre-validación.

### 2.4 Modelo de Tokens/Costo

La pre-validación usa un prompt ligero (~200 tokens input + imagen). Con Claude Sonnet:
- **Costo estimado**: ~$0.003-0.008 por validación (imagen ≈ 1-2K tokens).
- **Optimización**: usar `claude-haiku` para pre-validación (más rápido, más barato) y `claude-sonnet` para análisis profundo. Configurable desde `ConfiguracionIA` con claves separadas:
  - `pre_validator` → Haiku (rápido, barato)
  - `document_analyzer` → Sonnet (profundo, preciso)

---

## 3. Sistema Anti-Troll — Límite de Intentos

### 3.1 Problema

Un usuario malintencionado podría:
- Subir imágenes basura repetidamente para consumir tokens de IA.
- Saturar el sistema con intentos de carga.
- Intentar "engañar" a la IA con imágenes similares.

### 3.2 Solución: Tabla `intentos_documento`

**Nuevo modelo Prisma:**

```prisma
model IntentoDocumento {
  id            String   @id @default(uuid()) @db.Uuid
  asociadoId    String   @map("asociado_id") @db.Uuid
  tipo          TipoDocumento
  resultado     String   @db.VarChar(20)  // "aprobado", "rechazado", "advertencia"
  motivo        String?
  confianza     Float?
  ipAddress     String?  @map("ip_address") @db.VarChar(45)
  createdAt     DateTime @default(now()) @map("created_at")

  asociado      Asociado @relation(fields: [asociadoId], references: [id], onDelete: Cascade)

  @@index([asociadoId, tipo, createdAt])
  @@map("intentos_documento")
}
```

### 3.3 Reglas de Límite

| Parámetro | Valor Sugerido | Configurable |
|-----------|---------------|--------------|
| Máx rechazos por tipo por hora | 5 | Sí (env var o config BD) |
| Máx rechazos totales por día | 15 | Sí |
| Bloqueo temporal tras exceder | 1 hora | Sí |
| Bloqueo permanente (admin review) | Tras 3 bloqueos temporales en 24h | Sí |

**Lógica en `DocumentosService.preValidateDocument()`:**

```typescript
async preValidateDocument(asociadoId: string, file: Buffer, tipo: string) {
  // 1. Verificar bloqueo
  const rechazosRecientes = await this.prisma.intentoDocumento.count({
    where: {
      asociadoId,
      tipo: tipo as any,
      resultado: 'rechazado',
      createdAt: { gte: subHours(new Date(), 1) },  // Última hora
    },
  });

  if (rechazosRecientes >= MAX_RECHAZOS_POR_HORA) {
    return {
      aprobada: false,
      bloqueado: true,
      motivo: 'Has excedido el límite de intentos para este documento.',
      sugerencia: 'Espera 1 hora o contacta a soporte.',
      intentosRestantes: 0,
    };
  }

  // 2. Enviar a IA (prompt ligero)
  const resultado = await this.aiService.preValidate(file, contentType, tipo);

  // 3. Registrar intento
  await this.prisma.intentoDocumento.create({
    data: {
      asociadoId,
      tipo: tipo as any,
      resultado: resultado.aprobada ? 'aprobado' : 'rechazado',
      motivo: resultado.motivo,
      confianza: resultado.confianza,
    },
  });

  // 4. Retornar con intentos restantes
  return {
    ...resultado,
    intentosRestantes: MAX_RECHAZOS_POR_HORA - rechazosRecientes - (resultado.aprobada ? 0 : 1),
    bloqueado: false,
  };
}
```

### 3.4 Qué pasa cuando un troll es detectado

1. **Bloqueo temporal** (1h): El asociado ve "Intenta más tarde" en la app.
2. **Bloqueo repetido** (3+ en 24h): Se crea una `NotaAsociado` automática tipo `alerta_abuso` visible para operadores.
3. **Dashboard de operador**: El CRM puede mostrar una alerta "X asociados bloqueados por intentos excesivos" para revisión manual.
4. **Opcionalemente**: Cambiar estado del asociado a `suspendido` automáticamente tras N bloqueos reiterados. Esto requeriría intervención del operador para reactivar.

---

## 4. CAPA 2 — Análisis desde el CRM (Admin sube docs)

### 4.1 Nuevo Endpoint: Upload desde CRM

Actualmente `POST /documentos/upload` usa `@CurrentUser('id')` como `asociadoId`, lo que asume que quien sube es el asociado. Para permitir que un admin/operador suba documentos en nombre de un asociado:

**Nuevo endpoint:**

```typescript
// documentos.controller.ts
@Post('upload-para/:asociadoId')
@UseGuards(PermisosGuard)
@Permisos('documentos:cargar')   // Nuevo permiso
@ApiOperation({ summary: 'Subir documento en nombre de un asociado (admin/operador)' })
@UseInterceptors(FileInterceptor('file'))
async uploadForAsociado(
  @Param('asociadoId') asociadoId: string,
  @CurrentUser('id') operadorId: string,
  @UploadedFile(...) file: Express.Multer.File,
  @Body() dto: UploadDocumentDto,
) {
  // Llama al mismo service pero registra quién lo subió
  const doc = await this.documentosService.uploadDocument(asociadoId, file, dto.tipo);
  // Nota automática: "Documento subido por operador [nombre]"
  await this.notasService.create({
    asociadoId,
    autorId: operadorId,
    contenido: `Documento "${dto.tipo}" cargado por operador`,
    tipo: 'carga_documento',
  });
  return doc;
}
```

**¿La IA también pre-valida en este flujo?**
- **Sí**, pero con tolerancia mayor. El operador debería poder forzar la subida incluso si la IA rechaza.
- Flujo CRM: Operador selecciona archivo → IA pre-valida → si rechaza, muestra advertencia pero permite "Subir de todos modos".
- La imagen pasa a MinIO de cualquier forma, y el analysis profundo corre como siempre.

### 4.2 UI en el CRM — Carga de Documentos por Asociado

Agregar en `AsociadoDetailModal` (o vista de detalle) un panel de carga:

```
┌─────────────────────────────────────────────────────────────┐
│  Documentos del Asociado                                     │
│                                                             │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌──────────────────┐  │
│  │INE Front│ │INE Rev  │ │ Selfie  │ │Tarjeta Circul.   │  │
│  │  ✅ 95% │ │  ✅ 88% │ │ ⏳ Pend │ │ ❌ Rechazado     │  │
│  │ [Ver]   │ │ [Ver]   │ │ [Subir] │ │ [Re-subir]       │  │
│  └─────────┘ └─────────┘ └─────────┘ └──────────────────┘  │
│                                                             │
│  [⬆️ Cargar documento]  — Dropdown: tipo → file picker     │
└─────────────────────────────────────────────────────────────┘
```

### 4.3 Auto-aprobación Inteligente

Cuando la IA completa el análisis profundo con alta confianza:

| Condición | Acción |
|-----------|--------|
| Confianza global ≥ 90% Y todas las validaciones pasan | Auto-aprobar documento |
| Confianza 70-89% O alguna validación falla | Marcar para revisión manual |
| Confianza < 70% O validaciones críticas fallan | Auto-rechazar con motivo |

**Implementación en `AiAnalysisService.runAnalysis()`:**

```typescript
// Después de guardar el análisis exitoso...
if (data.confianza_global >= 0.90 && allValidationsPass(data.validaciones)) {
  await this.prisma.documento.update({
    where: { id: doc.id },
    data: { estado: 'aprobado', fechaRevision: new Date() },
  });
  // Verificar si TODOS los docs del asociado están aprobados → auto-activar
  await this.checkAndAutoActivate(doc.asociadoId);
}
```

---

## 5. Notificaciones de Documentos Faltantes

### 5.1 Problema

Un asociado se registra, pero nunca sube sus documentos. No hay recordatorio ni consecuencia.

### 5.2 Solución: Cron Job de Recordatorios

**Nuevo servicio: `DocumentReminderService`**

```typescript
@Injectable()
export class DocumentReminderService {
  // Ejecutar cada 24 horas
  @Cron('0 10 * * *')  // 10 AM diario
  async checkPendingDocuments() {
    const asociadosSinDocs = await this.prisma.asociado.findMany({
      where: {
        estado: 'pendiente',
        documentos: {
          none: {},  // Cero documentos subidos
        },
        createdAt: {
          lte: subDays(new Date(), 3),  // Registrado hace 3+ días
        },
      },
    });

    for (const a of asociadosSinDocs) {
      const diasRegistro = differenceInDays(new Date(), a.createdAt);

      if (diasRegistro === 3) {
        // Primer recordatorio
        await this.notificaciones.sendPush(a.id,
          'Completa tus documentos',
          'Sube tu INE, selfie y tarjeta de circulación para activar tu membresía.'
        );
      } else if (diasRegistro === 7) {
        // Segundo recordatorio (urgencia)
        await this.notificaciones.sendPush(a.id,
          'Documentación pendiente',
          'Tienes 7 días más para completar tu documentación o tu cuenta será suspendida.'
        );
      } else if (diasRegistro >= 14) {
        // Suspensión automática
        await this.prisma.asociado.update({
          where: { id: a.id },
          data: { estado: 'suspendido', motivoRechazo: 'Documentación no completada en 14 días' },
        });
        await this.notificaciones.sendPush(a.id,
          'Cuenta suspendida',
          'Tu cuenta fue suspendida por no completar la documentación requerida. Contacta a soporte.'
        );
      }
    }
  }
}
```

### 5.3 Notificaciones para Documentos Incompletos

También aplica cuando el asociado subió **algunos** pero no **todos**:

| Escenario | Días sin completar | Acción |
|-----------|-------------------|--------|
| 0 de 4 documentos | 3 días | Push: "Sube tus documentos para activar tu membresía" |
| 1-3 de 4 documentos | 5 días | Push: "Te faltan X documentos: [lista]" |
| Cualquiera | 7 días | Push urgente: "7 días restantes" |
| Cualquiera | 14 días | Suspensión automática + Push |
| Doc rechazado sin re-subir | 5 días | Push: "Tu [tipo] fue rechazado. Sube uno nuevo." |

### 5.4 Indicador en la App

En la pantalla de Home del asociado, mostrar un **banner persistente** si tiene documentos pendientes:

```
┌─────────────────────────────────────────────────┐
│ ⚠️ Documentación incompleta                     │
│ Te faltan 2 documentos para activar tu cuenta.  │
│ Tienes hasta el [fecha] para completarlos.      │
│                          [Completar ahora →]    │
└─────────────────────────────────────────────────┘
```

---

## 6. Restricción Funcional por Estado KYC

### 6.1 Guard Backend: `EstadoAsociadoGuard`

```typescript
@Injectable()
export class EstadoAsociadoGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Solo aplicar a asociados (no a usuarios CRM)
    if (user.tipo !== 'asociado') return true;

    const asociado = await this.prisma.asociado.findUnique({
      where: { id: user.id },
      select: { estado: true },
    });

    if (!asociado || asociado.estado !== 'activo') {
      throw new ForbiddenException({
        code: 'CUENTA_NO_ACTIVA',
        estado: asociado?.estado || 'desconocido',
        message: MENSAJES_ESTADO[asociado?.estado] || 'Tu cuenta no está activa.',
      });
    }

    return true;
  }
}

const MENSAJES_ESTADO = {
  pendiente: 'Tu cuenta está pendiente de aprobación. Completa tu documentación.',
  suspendido: 'Tu cuenta ha sido suspendida. Contacta a soporte.',
  rechazado: 'Tu solicitud fue rechazada.',
  baja: 'Tu cuenta fue dada de baja.',
};
```

### 6.2 Aplicación por Endpoint

| Endpoint | ¿Requiere estado activo? | Notas |
|----------|------------------------|-------|
| `POST /cupones` (generar cupón) | ✅ Sí | Principal beneficio de la membresía |
| `POST /casos-legales` (reportar SOS) | ✅ Sí | Servicio premium |
| `GET /promociones` | ❌ No | Puede ver promos (incentivo para completar KYC) |
| `GET /cupones/mis-cupones` | ❌ No | Puede ver historial |
| `POST /documentos/upload` | ❌ No | Necesita subir docs para activarse |
| `POST /documentos/pre-validar` | ❌ No | Necesita pre-validar para subir |
| `POST /vehiculos` | ❌ No | Puede registrar vehículo como parte del KYC |
| `GET /asociados/me` | ❌ No | Puede ver su perfil siempre |
| `PUT /asociados/me` | ❌ No | Puede editar su perfil siempre |

### 6.3 Comportamiento en la App Flutter

**Tabs con estado activo requerido (Promociones, SOS):**

```dart
// En la pantalla de Promociones
if (asociado.estado != 'activo') {
  return LockedFeatureOverlay(
    icon: Icons.lock_outlined,
    title: 'Función no disponible',
    message: 'Completa tu documentación y espera la aprobación para acceder a promociones.',
    actionLabel: 'Completar documentos',
    onAction: () => context.go('/documents'),
  );
}
```

El usuario puede navegar a la pestaña (no se oculta), pero ve un overlay con:
- Ícono de candado.
- Mensaje explicativo según su estado.
- Botón que lo lleva a completar documentos.

---

## 7. Plan de Implementación — Fases

### Fase 1: Fundamentos (Prioridad Alta)

| # | Tarea | Componente | Esfuerzo |
|---|-------|-----------|----------|
| 1.1 | Crear modelo `IntentoDocumento` + migración | API (Prisma) | Bajo |
| 1.2 | Crear endpoint `POST /documentos/pre-validar` | API | Medio |
| 1.3 | Crear prompt de pre-validación (`pre-validation-prompt.ts`) | API | Bajo |
| 1.4 | Integrar pre-validación en `DocumentsScreen` (Flutter) | App | Medio |
| 1.5 | Crear `EstadoAsociadoGuard` y aplicar a endpoints | API | Medio |
| 1.6 | Crear `LockedFeatureOverlay` widget en App | App | Bajo |
| 1.7 | Modificar `findAll` de asociados para incluir resumen docs+vehículos | API | Bajo |
| 1.8 | Agregar columnas de documentos y vehículos en tabla CRM | Web | Medio |

### Fase 2: CRM Upload + Auto-aprobación

| # | Tarea | Componente | Esfuerzo |
|---|-------|-----------|----------|
| 2.1 | Crear endpoint `POST /documentos/upload-para/:asociadoId` | API | Bajo |
| 2.2 | Crear permiso `documentos:cargar` | API (seed + RBAC) | Bajo |
| 2.3 | UI de carga en `AsociadoDetailModal` | Web | Medio |
| 2.4 | Auto-aprobación por confianza en `AiAnalysisService` | API | Medio |
| 2.5 | Auto-activación de asociado cuando todos los docs están aprobados | API | Bajo |

### Fase 3: Notificaciones + Recordatorios

| # | Tarea | Componente | Esfuerzo |
|---|-------|-----------|----------|
| 3.1 | Configurar FCM en App Flutter (tokens al backend) | App + API | Alto |
| 3.2 | Crear `DocumentReminderService` con cron jobs | API | Medio |
| 3.3 | Banner de documentación pendiente en Home de App | App | Bajo |
| 3.4 | Suspensión automática por inactividad documental | API | Bajo |

### Fase 4: Config IA separada (pre-validador vs analizador)

| # | Tarea | Componente | Esfuerzo |
|---|-------|-----------|----------|
| 4.1 | Crear config `pre_validator` en `ConfiguracionIA` | API + Web | Bajo |
| 4.2 | `AiService` selecciona modelo según clave de config | API | Medio |
| 4.3 | Soporte multi-provider (OpenAI, Google) si se desea | API | Alto |

---

## 8. Mejoras a la Tabla de Asociados (CRM)

### 8.1 Problema Actual

La tabla de asociados solo muestra: Nombre, Teléfono, Estado, Fecha Registro, Acción (ojo). Para saber si un asociado subió documentos o tiene vehículos, hay que abrir el detalle uno por uno.

### 8.2 Solución: Columnas de Resumen Visual

**Cambios en el backend (`findAll`):**
- Incluir resumen de documentos por tipo con estado.
- Incluir vehículos con marca/modelo/placas.

**Nuevo include en el query:**

```typescript
include: {
  _count: { select: { vehiculos: true, documentos: true, cupones: true } },
  documentos: {
    select: { tipo: true, estado: true },
  },
  vehiculos: {
    select: { marca: true, modelo: true, placas: true, esPrincipal: true },
    take: 3,
    orderBy: { esPrincipal: 'desc' },
  },
},
```

**Nuevas columnas en la tabla CRM:**

| Columna | Contenido |
|---------|-----------|
| **Documentos** | 4 iconitos (INE-F, INE-R, Selfie, TC) con estado por color: 🟢 aprobado, 🟡 pendiente, 🔴 rechazado, ⚪ no enviado |
| **Vehículos** | Badge con marca/modelo del principal + count si hay más: "Nissan Tsuru +2" |

---

## 9. Consideraciones de Seguridad

| Riesgo | Mitigación |
|--------|-----------|
| Pre-validación consume tokens | Rate limiting por asociado (tabla `intentos_documento`) + usar Haiku (más barato) |
| Imagen maliciosa (exploit en parser) | Solo JPEG/PNG/WebP/PDF validados por NestJS pipe + no se procesan archivos mal formados |
| Bypass de pre-validación (app modificada) | El análisis profundo sigue corriendo post-upload como segunda capa |
| DDoS al endpoint de pre-validación | Rate limiting general + autenticación JWT requerida |
| Datos personales en análisis IA | Los datos se quedan en BD, no se comparten. API key de Anthropic no logguea datos (verificar política) |

---

## 10. Resumen Ejecutivo

1. **IA en APP**: Pre-validación rápida con prompt ligero (Haiku) ANTES de subir. Evita basura en MinIO, ahorra tiempo al operador, y da feedback inmediato al usuario.

2. **IA en CRM**: Análisis profundo existente + nuevo flujo para que admin/operador pueda subir documentos en nombre del asociado.

3. **Anti-troll**: Tabla `intentos_documento` con límite de rechazos por hora/día. Bloqueo temporal + alerta automática para operadores.

4. **Notificaciones**: Cron job diario que envía recordatorios a los 3, 7 y 14 días. Suspensión automática a los 14 días sin completar documentación.

5. **Restricción KYC**: `EstadoAsociadoGuard` bloquea cupones y SOS hasta que `estado === 'activo'`. La app muestra overlay de candado con CTA a documentos.

6. **Tabla CRM mejorada**: Columnas visuales de documentos (4 iconitos con colores) y vehículos (badge compacto), eliminando la necesidad de abrir cada detalle.
