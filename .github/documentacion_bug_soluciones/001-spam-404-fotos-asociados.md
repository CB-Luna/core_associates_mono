# Bug #001 — Spam de errores 404 en tabla de asociados (fotos)

**Fecha detectado**: 26 de marzo de 2026  
**Fecha resuelto**: 26 de marzo de 2026  
**Commit fix**: `9a07e22`  
**Severidad**: Alta (visual, afectaba UX y saturaba la consola del navegador)

---

## Síntoma

Al abrir `/asociados` en el CRM web, la consola del navegador mostraba un **flood de errores 404**:

```
GET https://core-asoc.cbluna-dev.com/api/v1/asociados/76c4d21e-c56f-4000-e5a6-dc4311b64aed/foto  404 (Not Found)
GET https://core-asoc.cbluna-dev.com/api/v1/asociados/5298c6c4-6e17-44ef-91ab-b05012494f9f/foto  404 (Not Found)
GET https://core-asoc.cbluna-dev.com/api/v1/asociados/abc8662c-c678-40f6-a0ce-e69e2de273d0/foto  404 (Not Found)
... (uno por cada asociado en la tabla)
```

Con 19 asociados en la BD → 15–19 requests 404 simultáneos en cada carga de la página. El error ocurría tanto en `localhost:3600` como en producción `https://core-asoc.cbluna-dev.com`.

---

## Diagnóstico — Causa raíz

### El componente `AsociadoPhoto`

El componente `AsociadoPhoto.tsx` es el avatar que aparece en la primera columna de todas las tablas. Su comportamiento original era:

```tsx
// ANTES — INCORRECTO
useEffect(() => {
  const id = asociado.id;
  if (!id) return;
  if (photoCache.has(id)) { ... return; }

  // ❌ Siempre hacía fetch, sin importar si el asociado tenía foto o no
  apiImageUrl(`/asociados/${id}/foto`, { signal: ctrl.signal })
    .then(...)
    .catch(...);
}, [asociado.id]);
```

### Por qué generaba 404s

El endpoint `GET /asociados/:id/foto` en el backend devuelve **404 cuando**:
1. El asociado no tiene `fotoUrl` en la BD, **Y**
2. El asociado no tiene ningún documento de tipo `selfie` no rechazado

La mayoría de asociados en onboarding (estado `pendiente`) no tienen foto todavía → cada uno generaba un 404 inevitable.

### Lo que ya tenía el API que no se usaba

El endpoint `GET /asociados` (lista paginada) ya incluye en su respuesta:
- `fotoUrl: string | null` — la clave S3 de la foto, o `null` si no tiene
- `documentos: [{ tipo, estado }]` — lista de documentos del asociado

Esta información ya estaba disponible en el frontend al renderizar la tabla, pero `AsociadoPhoto` la ignoraba completamente y siempre lanzaba el fetch de todas formas.

### Intentos fallidos previos

Antes del fix real se implementó una caché (`Map<string, string | null>` a nivel de módulo) con `AbortController`. Eso **redujo duplicados** (mismo ID no se consultaba 2 veces), pero **no eliminó los 404** porque la primera consulta por cada ID seguía ocurriendo aunque el resultado fuera 404.

---

## Solución

Aprovechar los datos que **ya devuelve la API** para decidir si tiene sentido hacer fetch o no.

### Lógica aplicada

```
si fotoUrl === null:
  si NO existe documento selfie con estado != 'rechazado':
    → no hacer fetch, usar iniciales directamente
  si SÍ existe selfie válido:
    → hacer fetch (el backend tiene fallback a selfie)
si fotoUrl !== null (string):
  → hacer fetch (hay foto subida)
si fotoUrl === undefined (dato no disponible):
  → hacer fetch (no sabemos, mejor intentar)
```

### Archivos modificados

#### `core-associates-web/src/components/shared/AsociadoPhoto.tsx`

1. Se extendió la interfaz `Props` para aceptar `fotoUrl` y `documentos`:

```tsx
interface Props {
  asociado: {
    id?: string;
    nombre?: string;
    apellidoPat?: string;
    fotoUrl?: string | null;          // nuevo
    documentos?: Array<{ tipo: string; estado?: string }>;  // nuevo
  };
  // ...
}
```

2. Se agregó la comprobación antes del fetch:

```tsx
// Skip fetch si sabemos que no hay foto
if (asociado.fotoUrl === null) {
  const hasSelfie = Array.isArray(asociado.documentos) &&
    asociado.documentos.some(d => d.tipo === 'selfie' && d.estado !== 'rechazado');
  if (!hasSelfie) {
    photoCache.set(id, null);   // cachear resultado para no re-evaluar
    return;                     // mostrar iniciales sin ningún request
  }
}
```

#### `core-associates-web/src/components/shared/AsociadoDetailModal.tsx`

Se cambió el fetch de foto en `useEffect` y `refreshAsociado` para que solo ocurra si hay indicios de foto:

```tsx
// ANTES
apiImageUrl(`/asociados/${asociadoId}/foto`).then(setFotoUrl).catch(() => {});

// DESPUÉS
const hasFoto = data.fotoUrl || data.documentos?.some(
  (d: any) => d.tipo === 'selfie' && d.estado !== 'rechazado',
);
if (hasFoto) {
  apiImageUrl(`/asociados/${asociadoId}/foto`).then(setFotoUrl).catch(() => setFotoUrl(null));
}
```

#### `core-associates-web/src/app/(dashboard)/asociados/[id]/page.tsx`

Se encadenó el fetch de foto después de cargar los datos del asociado, con la misma comprobación:

```tsx
// ANTES: dos useEffect independientes, uno siempre hacía fetch de foto
// DESPUÉS: un solo useEffect que condiciona el fetch de foto
useEffect(() => {
  apiClient<Asociado>(`/asociados/${id}`)
    .then((data) => {
      setAsociado(data);
      const hasFoto = data.fotoUrl || data.documentos?.some(
        (d: any) => d.tipo === 'selfie' && d.estado !== 'rechazado',
      );
      if (hasFoto) {
        apiImageUrl(`/asociados/${id}/foto`).then(setFotoUrl).catch(() => {});
      }
    })
    .catch(console.error)
    .finally(() => setLoading(false));
}, [id]);
```

---

## Comportamiento final

| Caso | Requests HTTP | Resultado visual |
|---|---|---|
| Asociado sin foto y sin selfie | **0 requests** | Iniciales (gradiente) |
| Asociado sin `fotoUrl` pero con selfie aprobado | 1 request → 200 | Foto (selfie como avatar) |
| Asociado con `fotoUrl` definido | 1 request → 200 | Foto de perfil |
| Asociado con selfie rechazado (único doc) | **0 requests** | Iniciales |

Con 19 asociados donde 15 no tienen foto → **de 15 requests 404 a 0 requests innecesarios**.

---

## Referencia al backend (para contexto)

El endpoint `GET /asociados/:id/foto` en `asociados.service.ts → getFotoBuffer()` tiene este comportamiento:

```typescript
// 1. Intentar foto de perfil
if (asociado.fotoUrl) {
  return buffer desde MinIO bucket 'core-associates-photos';
}
// 2. Fallback: selfie del KYC
const selfie = await prisma.documento.findFirst({
  where: { asociadoId, tipo: 'selfie', estado: { not: 'rechazado' } }
});
if (selfie) return buffer desde bucket del selfie;

// 3. Sin foto → null → controller lanza NotFoundException (404)
return null;
```

---

## Regla de oro para futuros componentes similares

> Si el endpoint de imagen puede devolver 404 "esperado" (dato ausente), y el padre ya tiene información para predecirlo, **nunca hagas el fetch a ciegas** — usa los datos del padre para decidir si vale la pena intentarlo.

Patrón correcto (ver también `VehiclePhoto.tsx` que ya lo implementaba bien desde el inicio):

```tsx
useEffect(() => {
  if (!fotoUrl) return;  // ← skip explícito si no hay foto
  fetch('/vehiculos/${id}/foto')...
}, [vehiculoId, fotoUrl]);
```
