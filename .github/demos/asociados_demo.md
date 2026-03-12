# Asociados Demo — Números de prueba

> **Código OTP para todos**: `000000` (seis ceros)

---

## Números para registro nuevo (sin cuenta existente)

Estos números se pueden dar al cliente para que descargue el APK y se dé de alta desde cero. Al ingresar el número en la app y usar el código `000000`, se creará un asociado nuevo en estado `pendiente`.

| # | Teléfono (con lada) | En la app ingresar | Estado |
|---|---|---|---|
| 1 | +52 55 2000 0001 | `5520000001` | 🟢 Disponible |
| 2 | +52 55 2000 0002 | `5520000002` | 🟢 Disponible |
| 3 | +52 55 2000 0003 | `5520000003` | 🟢 Disponible |
| 4 | +52 55 2000 0004 | `5520000004` | 🟢 Disponible |
| 5 | +52 55 2000 0005 | `5520000005` | 🟢 Disponible |
| 6 | +52 55 3000 0001 | `5530000001` | 🟢 Disponible |
| 7 | +52 55 3000 0002 | `5530000002` | 🟢 Disponible |
| 8 | +52 55 3000 0003 | `5530000003` | 🟢 Disponible |
| 9 | +52 55 3000 0004 | `5530000004` | 🟢 Disponible |
| 10 | +52 55 3000 0005 | `5530000005` | 🟢 Disponible |

> **Nota**: una vez que un número se usa para registrarse, ya queda con cuenta creada. Si se necesitan más números "frescos", se pueden agregar en la variable `DEMO_PHONES` del servidor o en el fallback de `auth.service.ts`.

---

## Números con cuenta existente (del seed)

Estos ya tienen un asociado creado con datos de prueba. Al hacer login, entran directo al home.

| Teléfono | En la app | Asociado | Estado |
|---|---|---|---|
| +52 55 1234 5678 | `5512345678` | ⚠️ Ya usado (registro previo) | activo/pendiente |
| +52 55 1000 0001 | `5510000001` | Juan Pérez (ASC-0001) | activo |
| +52 55 1000 0002 | `5510000002` | María González (ASC-0002) | activo |
| +52 55 1000 0003 | `5510000003` | Roberto Hernández (ASC-0003) | activo |

---

## Usuarios CRM Web (admin/operador)

Para acceder al panel web en `https://core-asoc.cbluna-dev.com`:

| Rol | Email | Contraseña |
|---|---|---|
| Admin | `admin@coreassociates.com` | `Admin2026!` |
| Operador | `operador@coreassociates.com` | `Operador2026!` |
| Proveedor | `proveedor@elrapido.com` | `Proveedor2026!` |

---

## Flujo de prueba completo

1. **Registro**: Abrir app → ingresar uno de los números disponibles → código `000000` → se crea cuenta pendiente
2. **Completar perfil**: Llenar nombre, apellidos, fecha de nacimiento
3. **Subir documentos**: INE frente/reverso, selfie, tarjeta de circulación
4. **Aprobación**: Entrar al CRM web como operador → Asociados → buscar el nuevo → aprobar documentos → aprobar membresía
5. **Usar beneficios**: Ya como activo, ver promociones, generar cupones, usar SOS legal

---

## Configuración técnica

Los números demo están definidos en:
- **Código**: `core-associates-api/src/modules/auth/auth.service.ts` (fallback `defaultDemoPhones`)
- **Variable de entorno**: `DEMO_PHONES` en `.env` (sobreescribe el fallback si se define)
- **Referencia**: `.env.example` tiene la lista completa documentada

Para agregar más números: editar el array `defaultDemoPhones` en `auth.service.ts` y re-deployar, o bien agregar a la variable `DEMO_PHONES` en el `.env` del servidor y reiniciar el contenedor API.


Provedor: edna_proveedor@gmail.com, Contra: Edna_proveedor1
Operador: edna_operador@gmail.com, Contra: Edna_operador1