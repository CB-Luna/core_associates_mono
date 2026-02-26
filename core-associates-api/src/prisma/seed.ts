import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

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
      proveedorId: proveedor.id,
      estado: 'activo',
    },
  });
  console.log(`Proveedor user created: ${proveedorUser.email}`);

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
