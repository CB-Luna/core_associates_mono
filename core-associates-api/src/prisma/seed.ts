import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcrypt';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

// IDs fijos de roles (coinciden con la migración RBAC)
const ROL_ADMIN_ID     = 'a0000000-0000-4000-8000-000000000001';
const ROL_OPERADOR_ID  = 'a0000000-0000-4000-8000-000000000002';
const ROL_PROVEEDOR_ID = 'a0000000-0000-4000-8000-000000000003';
const ROL_ABOGADO_ID   = 'a0000000-0000-4000-8000-000000000004';

async function main() {
  console.log('Seeding database...');

  // Crear usuario administrador
  const adminPasswordHash = await bcrypt.hash('Admin2026!', 10);
  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@coreassociates.com' },
    update: {},
    create: {
      email: 'admin@coreassociates.com',
      passwordHash: adminPasswordHash,
      nombre: 'Administrador',
      rol: 'admin',
      rolId: ROL_ADMIN_ID,
      estado: 'activo',
    },
  });
  console.log(`Admin created: ${admin.email}`);

  // Crear usuario operador
  const operadorPasswordHash = await bcrypt.hash('Operador2026!', 10);
  const operador = await prisma.usuario.upsert({
    where: { email: 'operador@coreassociates.com' },
    update: {},
    create: {
      email: 'operador@coreassociates.com',
      passwordHash: operadorPasswordHash,
      nombre: 'Operador Principal',
      rol: 'operador',
      rolId: ROL_OPERADOR_ID,
      estado: 'activo',
    },
  });
  console.log(`Operador created: ${operador.email}`);

  // Crear proveedor de ejemplo
  const proveedor = await prisma.proveedor.upsert({
    where: { idUnico: 'PRV-0001' },
    update: {},
    create: {
      idUnico: 'PRV-0001',
      razonSocial: 'Taller Mecánico El Rápido',
      tipo: 'taller',
      direccion: 'Av. Principal #123, Col. Centro, CDMX',
      latitud: 19.4326,
      longitud: -99.1332,
      telefono: '+525512345678',
      email: 'contacto@elrapido.com',
      contactoNombre: 'Carlos Méndez',
      estado: 'activo',
    },
  });
  console.log(`Proveedor created: ${proveedor.razonSocial}`);

  // Crear usuario proveedor
  const proveedorPasswordHash = await bcrypt.hash('Proveedor2026!', 10);
  const proveedorUser = await prisma.usuario.upsert({
    where: { email: 'proveedor@elrapido.com' },
    update: {},
    create: {
      email: 'proveedor@elrapido.com',
      passwordHash: proveedorPasswordHash,
      nombre: 'Carlos Méndez',
      rol: 'proveedor',
      rolId: ROL_PROVEEDOR_ID,
      proveedorId: proveedor.id,
      estado: 'activo',
    },
  });
  console.log(`Proveedor user created: ${proveedorUser.email}`);

  // Crear usuarios abogados
  const abogadoHash = await bcrypt.hash('Abogado2026!', 10);
  const abogado1 = await prisma.usuario.upsert({
    where: { email: 'abogado1@gmail.com' },
    update: {},
    create: {
      email: 'abogado1@gmail.com',
      passwordHash: abogadoHash,
      nombre: 'Lic. Roberto Hernández',
      rol: 'abogado',
      rolId: ROL_ABOGADO_ID,
      estado: 'activo',
      especialidad: 'Derecho Penal y Tránsito',
      cedulaProfesional: 'CP-123456',
      telefono: '+525555123456',
    },
  });
  console.log(`Abogado 1 created: ${abogado1.email}`);

  const abogado2 = await prisma.usuario.upsert({
    where: { email: 'abogado2@gmail.com' },
    update: {},
    create: {
      email: 'abogado2@gmail.com',
      passwordHash: abogadoHash,
      nombre: 'Lic. Patricia Gómez',
      rol: 'abogado',
      rolId: ROL_ABOGADO_ID,
      estado: 'activo',
      especialidad: 'Derecho Civil y Seguros',
      cedulaProfesional: 'CP-789012',
      telefono: '+525555789012',
    },
  });
  console.log(`Abogado 2 created: ${abogado2.email}`);

  // Crear segundo proveedor (comida)
  const proveedor2 = await prisma.proveedor.upsert({
    where: { idUnico: 'PRV-0002' },
    update: {},
    create: {
      idUnico: 'PRV-0002',
      razonSocial: 'Cocina Doña Mary',
      tipo: 'comida',
      direccion: 'Calle Sur #45, Col. Roma, CDMX',
      latitud: 19.4195,
      longitud: -99.1616,
      telefono: '+525598765432',
      email: 'contacto@donamary.com',
      contactoNombre: 'María López',
      estado: 'activo',
    },
  });
  console.log(`Proveedor 2 created: ${proveedor2.razonSocial}`);

  // Crear asociado de prueba
  const asociadoPrueba = await prisma.asociado.upsert({
    where: { telefono: '+525512345678' },
    update: {},
    create: {
      idUnico: 'ASC-0001',
      nombre: 'Juan',
      apellidoPat: 'Pérez',
      apellidoMat: 'García',
      telefono: '+525512345678',
      email: 'juan.perez@email.com',
      fechaNacimiento: new Date('1990-03-15'),
      estado: 'activo',
    },
  });
  console.log(`Asociado created: ${asociadoPrueba.nombre} ${asociadoPrueba.apellidoPat} (${asociadoPrueba.telefono})`);

  // Crear vehículo para el asociado
  const vehiculo = await prisma.vehiculo.upsert({
    where: { id: '00000000-0000-0000-0000-000000000001' },
    update: {},
    create: {
      id: '00000000-0000-0000-0000-000000000001',
      asociadoId: asociadoPrueba.id,
      marca: 'Nissan',
      modelo: 'Versa',
      anio: 2022,
      color: 'Blanco',
      placas: 'ABC-123-D',
      numeroSerie: '3N1CN7AD0NL000001',
      esPrincipal: true,
    },
  });
  console.log(`Vehiculo created: ${vehiculo.marca} ${vehiculo.modelo} (${vehiculo.placas})`);

  // Crear promociones activas
  const hoy = new Date();
  const en30dias = new Date(hoy.getTime() + 30 * 24 * 60 * 60 * 1000);

  const promo1 = await prisma.promocion.create({
    data: {
      proveedorId: proveedor.id,
      titulo: '20% en Servicio Mayor',
      descripcion: 'Descuento del 20% en servicio mayor completo incluyendo cambio de aceite, filtros y revisión de frenos.',
      tipoDescuento: 'porcentaje',
      valorDescuento: 20,
      fechaInicio: hoy,
      fechaFin: en30dias,
      vigenciaCupon: 48,
      terminos: 'Válido solo para asociados activos. Un cupón por servicio.',
      maxCupones: 100,
      estado: 'activa',
    },
  });
  console.log(`Promocion 1 created: ${promo1.titulo}`);

  const promo2 = await prisma.promocion.create({
    data: {
      proveedorId: proveedor.id,
      titulo: '$200 de descuento en Afinación',
      descripcion: 'Descuento de $200 pesos en afinación completa de 4 o 6 cilindros.',
      tipoDescuento: 'monto_fijo',
      valorDescuento: 200,
      fechaInicio: hoy,
      fechaFin: en30dias,
      vigenciaCupon: 72,
      terminos: 'No acumulable con otras promociones.',
      maxCupones: 50,
      estado: 'activa',
    },
  });
  console.log(`Promocion 2 created: ${promo2.titulo}`);

  const promo3 = await prisma.promocion.create({
    data: {
      proveedorId: proveedor2.id,
      titulo: '15% en Comidas',
      descripcion: 'Descuento del 15% en cualquier platillo del menú. Incluye desayunos, comidas y cenas.',
      tipoDescuento: 'porcentaje',
      valorDescuento: 15,
      fechaInicio: hoy,
      fechaFin: en30dias,
      vigenciaCupon: 24,
      terminos: 'Válido de lunes a viernes. Consumo mínimo $80 pesos.',
      maxCupones: 200,
      estado: 'activa',
    },
  });
  console.log(`Promocion 3 created: ${promo3.titulo}`);

  

  // Crear módulos de menú
  const menuItems = [
    { codigo: 'dashboard', titulo: 'Dashboard', ruta: '/dashboard', icono: 'LayoutDashboard', permisos: ['admin', 'operador', 'proveedor'], orden: 1 },
    { codigo: 'asociados', titulo: 'Asociados', ruta: '/asociados', icono: 'Users', permisos: ['admin', 'operador'], orden: 2 },
    { codigo: 'proveedores', titulo: 'Proveedores', ruta: '/proveedores', icono: 'Building2', permisos: ['admin', 'operador'], orden: 3 },
    { codigo: 'promociones', titulo: 'Promociones', ruta: '/promociones', icono: 'Tag', permisos: ['admin', 'operador', 'proveedor'], orden: 4 },
    { codigo: 'cupones', titulo: 'Cupones', ruta: '/cupones', icono: 'Ticket', permisos: ['admin', 'operador', 'proveedor'], orden: 5 },
    { codigo: 'casos-legales', titulo: 'Casos Legales', ruta: '/casos-legales', icono: 'Scale', permisos: ['admin', 'operador'], orden: 6 },
    { codigo: 'documentos', titulo: 'Documentos', ruta: '/documentos', icono: 'FileCheck', permisos: ['admin', 'operador'], orden: 7 },
    { codigo: 'reportes', titulo: 'Reportes', ruta: '/reportes', icono: 'BarChart3', permisos: ['admin'], orden: 8 },
    { codigo: 'configuracion', titulo: 'Configuraci\u00f3n', ruta: '/configuracion', icono: 'Settings', permisos: ['admin'], orden: 9 },
  ];

  for (const item of menuItems) {
    await prisma.moduloMenu.upsert({
      where: { codigo: item.codigo },
      update: { titulo: item.titulo, ruta: item.ruta, icono: item.icono, orden: item.orden },
      create: item,
    });
  }
  console.log(`Menu items created: ${menuItems.length}`);

  // Crear configuración IA por defecto
  await prisma.configuracionIA.upsert({
    where: { clave: 'document_analyzer' },
    update: {},
    create: {
      clave: 'document_analyzer',
      nombre: 'Analizador de Documentos',
      provider: 'anthropic',
      modelo: 'claude-sonnet-4-5-20250929',
      temperatura: 0.2,
      maxTokens: 4096,
      activo: true,
    },
  });
  console.log('AI config seeded: document_analyzer');

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
