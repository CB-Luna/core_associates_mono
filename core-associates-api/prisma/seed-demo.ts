import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes, createHmac } from 'crypto';

const prisma = new PrismaClient();
const HMAC_SECRET = 'core-associates-secret';

async function main() {
  console.log('=== SEED DEMO: Poblando datos de demostración ===\n');

  // ── USUARIOS ──
  const adminHash = await bcrypt.hash('Admin2026!', 10);
  const operadorHash = await bcrypt.hash('Operador2026!', 10);
  const proveedorHash = await bcrypt.hash('Proveedor2026!', 10);

  const admin = await prisma.usuario.upsert({
    where: { email: 'admin@coreassociates.com' },
    update: {},
    create: { email: 'admin@coreassociates.com', passwordHash: adminHash, nombre: 'Administrador', rol: 'admin', estado: 'activo' },
  });

  const operador = await prisma.usuario.upsert({
    where: { email: 'operador@coreassociates.com' },
    update: {},
    create: { email: 'operador@coreassociates.com', passwordHash: operadorHash, nombre: 'Operador Principal', rol: 'operador', estado: 'activo' },
  });

  console.log('✓ Usuarios admin y operador creados');

  // ── PROVEEDORES ──
  const proveedoresData = [
    { idUnico: 'PRV-0001', razonSocial: 'Taller Mecánico El Rápido', tipo: 'taller' as const, direccion: 'Av. Insurgentes Sur #1234, Col. Del Valle, CDMX', latitud: 19.3755, longitud: -99.1687, telefono: '+525512345678', email: 'contacto@elrapido.com', contactoNombre: 'Carlos Méndez' },
    { idUnico: 'PRV-0002', razonSocial: 'Cocina Doña Mary', tipo: 'comida' as const, direccion: 'Calle Sur #45, Col. Roma Norte, CDMX', latitud: 19.4195, longitud: -99.1616, telefono: '+525598765432', email: 'contacto@donamary.com', contactoNombre: 'María López' },
    { idUnico: 'PRV-0003', razonSocial: 'Despacho Jurídico Lex', tipo: 'abogado' as const, direccion: 'Av. Reforma #567, Col. Juárez, CDMX', latitud: 19.4270, longitud: -99.1580, telefono: '+525555123456', email: 'contacto@lexabogados.com', contactoNombre: 'Lic. Roberto Hernández' },
    { idUnico: 'PRV-0004', razonSocial: 'AutoLavado Express', tipo: 'lavado' as const, direccion: 'Calz. de Tlalpan #890, Col. Portales, CDMX', latitud: 19.3615, longitud: -99.1440, telefono: '+525556789012', email: 'autolavado@express.com', contactoNombre: 'Pedro Ramírez' },
    { idUnico: 'PRV-0005', razonSocial: 'Capacitación Vial MX', tipo: 'capacitacion' as const, direccion: 'Av. Universidad #321, Col. Narvarte, CDMX', latitud: 19.3890, longitud: -99.1550, telefono: '+525534567890', email: 'info@capacitacionvial.mx', contactoNombre: 'Ana Martínez' },
    { idUnico: 'PRV-0006', razonSocial: 'Taller de Carrocería Don Beto', tipo: 'taller' as const, direccion: 'Eje Central #456, Col. Doctores, CDMX', latitud: 19.4120, longitud: -99.1448, telefono: '+525578901234', email: 'donbeto@talleres.com', contactoNombre: 'Alberto Vega' },
    { idUnico: 'PRV-0007', razonSocial: 'Restaurante Los Compadres', tipo: 'comida' as const, direccion: 'Av. Coyoacán #789, Col. Del Valle Sur, CDMX', latitud: 19.3685, longitud: -99.1630, telefono: '+525567890123', email: 'reservas@loscompadres.mx', contactoNombre: 'Javier Torres' },
    { idUnico: 'PRV-0008', razonSocial: 'Abogados Asociados del Centro', tipo: 'abogado' as const, direccion: 'Av. 5 de Mayo #234, Centro Histórico, CDMX', latitud: 19.4341, longitud: -99.1386, telefono: '+525589012345', email: 'contacto@abogadoscentro.com', contactoNombre: 'Lic. Patricia Gómez' },
  ];

  const proveedores: any[] = [];
  for (const p of proveedoresData) {
    const prov = await prisma.proveedor.upsert({
      where: { idUnico: p.idUnico },
      update: {},
      create: { ...p, estado: 'activo' },
    });
    proveedores.push(prov);
  }
  console.log(`✓ ${proveedores.length} proveedores creados`);

  // Usuarios proveedor
  for (const prov of proveedores.slice(0, 3)) {
    await prisma.usuario.upsert({
      where: { email: prov.email },
      update: {},
      create: {
        email: prov.email,
        passwordHash: proveedorHash,
        nombre: prov.contactoNombre,
        rol: 'proveedor',
        proveedorId: prov.id,
        estado: 'activo',
      },
    });
  }
  console.log('✓ Usuarios proveedor creados');

  // ── ASOCIADOS ──
  const asociadosData = [
    { idUnico: 'ASC-0001', nombre: 'Juan', apellidoPat: 'Pérez', apellidoMat: 'García', telefono: '+525510000001', email: 'juan.perez@email.com', fechaNacimiento: new Date('1990-03-15'), estado: 'activo' as const },
    { idUnico: 'ASC-0002', nombre: 'María', apellidoPat: 'González', apellidoMat: 'López', telefono: '+525510000002', email: 'maria.gonzalez@email.com', fechaNacimiento: new Date('1985-07-22'), estado: 'activo' as const },
    { idUnico: 'ASC-0003', nombre: 'Roberto', apellidoPat: 'Hernández', apellidoMat: 'Martínez', telefono: '+525510000003', email: 'roberto.hdez@email.com', fechaNacimiento: new Date('1992-11-08'), estado: 'activo' as const },
    { idUnico: 'ASC-0004', nombre: 'Ana Lucía', apellidoPat: 'Ramírez', apellidoMat: 'Soto', telefono: '+525510000004', email: 'ana.ramirez@email.com', fechaNacimiento: new Date('1988-01-30'), estado: 'activo' as const },
    { idUnico: 'ASC-0005', nombre: 'Carlos', apellidoPat: 'Mendoza', apellidoMat: 'Ríos', telefono: '+525510000005', email: 'carlos.mendoza@email.com', fechaNacimiento: new Date('1995-05-12'), estado: 'activo' as const },
    { idUnico: 'ASC-0006', nombre: 'Patricia', apellidoPat: 'Vega', apellidoMat: 'Cruz', telefono: '+525510000006', email: 'patricia.vega@email.com', fechaNacimiento: new Date('1993-09-18'), estado: 'activo' as const },
    { idUnico: 'ASC-0007', nombre: 'Miguel Ángel', apellidoPat: 'Torres', apellidoMat: 'Díaz', telefono: '+525510000007', email: 'miguel.torres@email.com', fechaNacimiento: new Date('1987-04-25'), estado: 'activo' as const },
    { idUnico: 'ASC-0008', nombre: 'Fernanda', apellidoPat: 'Morales', apellidoMat: 'Jiménez', telefono: '+525510000008', email: 'fernanda.morales@email.com', fechaNacimiento: new Date('1991-12-03'), estado: 'activo' as const },
    { idUnico: 'ASC-0009', nombre: 'Diego', apellidoPat: 'Castillo', apellidoMat: 'Rojas', telefono: '+525510000009', email: 'diego.castillo@email.com', fechaNacimiento: new Date('1994-08-14'), estado: 'pendiente' as const },
    { idUnico: 'ASC-0010', nombre: 'Gabriela', apellidoPat: 'Flores', apellidoMat: 'Ortiz', telefono: '+525510000010', email: 'gabriela.flores@email.com', fechaNacimiento: new Date('1989-06-27'), estado: 'pendiente' as const },
    { idUnico: 'ASC-0011', nombre: 'Andrés', apellidoPat: 'Reyes', apellidoMat: 'Luna', telefono: '+525510000011', email: 'andres.reyes@email.com', fechaNacimiento: new Date('1996-02-09'), estado: 'pendiente' as const },
    { idUnico: 'ASC-0012', nombre: 'Laura', apellidoPat: 'Domínguez', apellidoMat: 'Núñez', telefono: '+525510000012', email: 'laura.dominguez@email.com', fechaNacimiento: new Date('1986-10-20'), estado: 'suspendido' as const },
  ];

  const asociados: any[] = [];
  for (const a of asociadosData) {
    const asoc = await prisma.asociado.upsert({
      where: { telefono: a.telefono },
      update: {},
      create: {
        ...a,
        fechaRegistro: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
        fechaAprobacion: a.estado === 'activo' ? new Date(Date.now() - Math.random() * 60 * 24 * 60 * 60 * 1000) : undefined,
        aprobadoPorId: a.estado === 'activo' ? admin.id : undefined,
      },
    });
    asociados.push(asoc);
  }
  console.log(`✓ ${asociados.length} asociados creados`);

  // ── VEHÍCULOS ──
  const vehiculosData = [
    { marca: 'Nissan', modelo: 'Versa', anio: 2022, color: 'Blanco', placas: 'ABC-123-D', numeroSerie: '3N1CN7AD0NL000001' },
    { marca: 'Chevrolet', modelo: 'Aveo', anio: 2021, color: 'Gris', placas: 'DEF-456-A', numeroSerie: '3G1TC5CF0ML000002' },
    { marca: 'Volkswagen', modelo: 'Vento', anio: 2023, color: 'Negro', placas: 'GHI-789-B', numeroSerie: 'WVWZZZ16ZNM000003' },
    { marca: 'Toyota', modelo: 'Yaris', anio: 2022, color: 'Rojo', placas: 'JKL-012-C', numeroSerie: 'JTDKN3DU0N0000004' },
    { marca: 'Hyundai', modelo: 'Grand i10', anio: 2021, color: 'Plata', placas: 'MNO-345-D', numeroSerie: 'MALA841CAMM000005' },
    { marca: 'Kia', modelo: 'Rio', anio: 2023, color: 'Azul', placas: 'PQR-678-E', numeroSerie: '3KPA25AB0NE000006' },
    { marca: 'Suzuki', modelo: 'Ciaz', anio: 2020, color: 'Blanco', placas: 'STU-901-F', numeroSerie: 'MA3EUD42S00000007' },
    { marca: 'Nissan', modelo: 'March', anio: 2021, color: 'Verde', placas: 'VWX-234-G', numeroSerie: '3N1CK3DS5ML000008' },
    { marca: 'Chevrolet', modelo: 'Beat', anio: 2022, color: 'Negro', placas: 'YZA-567-H', numeroSerie: '3G1TE5CF0NL000009' },
    { marca: 'Toyota', modelo: 'Corolla', anio: 2023, color: 'Blanco', placas: 'BCD-890-I', numeroSerie: '2T1BURHEXNC000010' },
    { marca: 'Ford', modelo: 'Figo', anio: 2020, color: 'Gris', placas: 'EFG-123-J', numeroSerie: 'MAJ6S3GE6LW000011' },
    { marca: 'Volkswagen', modelo: 'Polo', anio: 2022, color: 'Rojo', placas: 'HIJ-456-K', numeroSerie: 'WVWZZZ6RZNW000012' },
  ];

  for (let i = 0; i < asociados.length; i++) {
    await prisma.vehiculo.upsert({
      where: { id: `00000000-0000-0000-0000-00000000000${(i + 1).toString().padStart(1, '0')}` },
      update: {},
      create: {
        id: `00000000-0000-0000-0000-0000000000${(i + 1).toString().padStart(2, '0')}`,
        asociadoId: asociados[i].id,
        ...vehiculosData[i],
        esPrincipal: true,
      },
    });
  }
  console.log(`✓ ${asociados.length} vehículos creados`);

  // ── PROMOCIONES ──
  const hoy = new Date();
  const en60dias = new Date(hoy.getTime() + 60 * 24 * 60 * 60 * 1000);
  const hace30dias = new Date(hoy.getTime() - 30 * 24 * 60 * 60 * 1000);

  const promocionesData = [
    { proveedorIdx: 0, titulo: '20% en Servicio Mayor', descripcion: 'Descuento del 20% en servicio mayor completo incluyendo cambio de aceite, filtros y revisión de frenos.', tipoDescuento: 'porcentaje' as const, valorDescuento: 20, vigenciaCupon: 48, maxCupones: 100, estado: 'activa' as const },
    { proveedorIdx: 0, titulo: '$200 de Descuento en Afinación', descripcion: 'Descuento de $200 pesos en afinación completa de 4 o 6 cilindros.', tipoDescuento: 'monto_fijo' as const, valorDescuento: 200, vigenciaCupon: 72, maxCupones: 50, estado: 'activa' as const },
    { proveedorIdx: 1, titulo: '15% en Comidas', descripcion: 'Descuento del 15% en cualquier platillo del menú. Incluye desayunos, comidas y cenas.', tipoDescuento: 'porcentaje' as const, valorDescuento: 15, vigenciaCupon: 24, maxCupones: 200, estado: 'activa' as const },
    { proveedorIdx: 3, titulo: 'Lavado Premium $99', descripcion: 'Lavado completo exterior e interior con encerado y aromatizado por solo $99 (precio regular $199).', tipoDescuento: 'monto_fijo' as const, valorDescuento: 100, vigenciaCupon: 48, maxCupones: 150, estado: 'activa' as const },
    { proveedorIdx: 4, titulo: '30% en Curso de Manejo Defensivo', descripcion: 'Descuento del 30% en el curso completo de manejo defensivo (16 horas). Incluye certificado.', tipoDescuento: 'porcentaje' as const, valorDescuento: 30, vigenciaCupon: 168, maxCupones: 30, estado: 'activa' as const },
    { proveedorIdx: 5, titulo: '25% en Reparación de Carrocería', descripcion: 'Descuento del 25% en cualquier trabajo de hojalatería y pintura. Presupuesto sin compromiso.', tipoDescuento: 'porcentaje' as const, valorDescuento: 25, vigenciaCupon: 72, maxCupones: 40, estado: 'activa' as const },
    { proveedorIdx: 6, titulo: '2x1 en Comida Corrida', descripcion: 'Al presentar el cupón, obtén 2 comidas corridas por el precio de 1. De lunes a viernes.', tipoDescuento: 'porcentaje' as const, valorDescuento: 50, vigenciaCupon: 24, maxCupones: 100, estado: 'activa' as const },
    { proveedorIdx: 0, titulo: '10% en Refacciones', descripcion: 'Descuento del 10% en todas las refacciones y partes automotrices disponibles.', tipoDescuento: 'porcentaje' as const, valorDescuento: 10, vigenciaCupon: 48, maxCupones: 80, estado: 'pausada' as const },
  ];

  const promociones: any[] = [];
  for (const p of promocionesData) {
    const promo = await prisma.promocion.create({
      data: {
        proveedorId: proveedores[p.proveedorIdx].id,
        titulo: p.titulo,
        descripcion: p.descripcion,
        tipoDescuento: p.tipoDescuento,
        valorDescuento: p.valorDescuento,
        fechaInicio: p.estado === 'pausada' ? hace30dias : hoy,
        fechaFin: en60dias,
        vigenciaCupon: p.vigenciaCupon,
        terminos: 'Válido solo para asociados activos de Core Associates. No acumulable con otras promociones.',
        maxCupones: p.maxCupones,
        estado: p.estado,
      },
    });
    promociones.push(promo);
  }
  console.log(`✓ ${promociones.length} promociones creadas`);

  // ── CUPONES ──
  const asociadosActivos = asociados.filter(a => a.estado === 'activo');
  const cuponesCreados: any[] = [];

  // Cupones activos
  for (let i = 0; i < 8; i++) {
    const asoc = asociadosActivos[i % asociadosActivos.length];
    const promoIdx = i % promociones.length;
    const promo = promociones[promoIdx];
    const prov = proveedores[promocionesData[promoIdx].proveedorIdx];

    const codigo = `CPN-DEMO${(i + 1).toString().padStart(3, '0')}`;
    const qrPayload = JSON.stringify({ codigo, promocionId: promo.id, asociadoId: asoc.id, proveedorId: prov.id });
    const qrFirma = createHmac('sha256', HMAC_SECRET).update(qrPayload).digest('hex').substring(0, 128);

    const venc = new Date();
    venc.setHours(venc.getHours() + promo.vigenciaCupon);

    const cupon = await prisma.cupon.create({
      data: {
        codigo,
        asociadoId: asoc.id,
        promocionId: promo.id,
        proveedorId: prov.id,
        qrPayload,
        qrFirma,
        estado: 'activo',
        fechaGeneracion: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
        fechaVencimiento: venc,
      },
    });
    cuponesCreados.push(cupon);
  }

  // Cupones canjeados
  for (let i = 0; i < 15; i++) {
    const asoc = asociadosActivos[i % asociadosActivos.length];
    const promoIdx = i % promociones.length;
    const promo = promociones[promoIdx];
    const prov = proveedores[promocionesData[promoIdx].proveedorIdx];

    const codigo = `CPN-CNJ${(i + 1).toString().padStart(3, '0')}`;
    const qrPayload = JSON.stringify({ codigo, promocionId: promo.id, asociadoId: asoc.id, proveedorId: prov.id });
    const qrFirma = createHmac('sha256', HMAC_SECRET).update(qrPayload).digest('hex').substring(0, 128);

    const diasAtras = Math.floor(Math.random() * 30) + 1;
    const fechaGen = new Date(Date.now() - diasAtras * 24 * 60 * 60 * 1000);
    const fechaCanje = new Date(fechaGen.getTime() + Math.random() * promo.vigenciaCupon * 60 * 60 * 1000);

    await prisma.cupon.create({
      data: {
        codigo,
        asociadoId: asoc.id,
        promocionId: promo.id,
        proveedorId: prov.id,
        qrPayload,
        qrFirma,
        estado: 'canjeado',
        fechaGeneracion: fechaGen,
        fechaVencimiento: new Date(fechaGen.getTime() + promo.vigenciaCupon * 60 * 60 * 1000),
        fechaCanje: fechaCanje,
        canjeadoPorId: prov.id,
      },
    });
  }

  // Cupones vencidos
  for (let i = 0; i < 5; i++) {
    const asoc = asociadosActivos[i % asociadosActivos.length];
    const promoIdx = i % promociones.length;
    const promo = promociones[promoIdx];
    const prov = proveedores[promocionesData[promoIdx].proveedorIdx];

    const codigo = `CPN-VNC${(i + 1).toString().padStart(3, '0')}`;
    const qrPayload = JSON.stringify({ codigo, promocionId: promo.id, asociadoId: asoc.id, proveedorId: prov.id });
    const qrFirma = createHmac('sha256', HMAC_SECRET).update(qrPayload).digest('hex').substring(0, 128);

    const fechaGen = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);

    await prisma.cupon.create({
      data: {
        codigo,
        asociadoId: asoc.id,
        promocionId: promo.id,
        proveedorId: prov.id,
        qrPayload,
        qrFirma,
        estado: 'vencido',
        fechaGeneracion: fechaGen,
        fechaVencimiento: new Date(fechaGen.getTime() + promo.vigenciaCupon * 60 * 60 * 1000),
      },
    });
  }

  console.log(`✓ 28 cupones creados (8 activos, 15 canjeados, 5 vencidos)`);

  // ── CASOS LEGALES ──
  const abogadoProveedores = proveedores.filter(p => p.tipo === 'abogado');

  const casosData = [
    { asociadoIdx: 0, tipoPercance: 'accidente' as const, descripcion: 'Choque por alcance en Periférico Sur a la altura de San Jerónimo. Daños en la parte trasera del vehículo.', latitud: 19.3453, longitud: -99.1890, direccionAprox: 'Periférico Sur, Col. San Jerónimo, CDMX', estado: 'abierto' as const, prioridad: 'alta' as const },
    { asociadoIdx: 1, tipoPercance: 'infraccion' as const, descripcion: 'Infracción por supuesta vuelta prohibida en Eje Central y Fray Servando. El semáforo no tenía señalización clara.', latitud: 19.4230, longitud: -99.1440, direccionAprox: 'Eje Central y Fray Servando, CDMX', estado: 'en_atencion' as const, prioridad: 'media' as const },
    { asociadoIdx: 2, tipoPercance: 'asalto' as const, descripcion: 'Asalto a mano armada mientras esperaba pasaje en Tepito. Le robaron celular y efectivo.', latitud: 19.4427, longitud: -99.1210, direccionAprox: 'Col. Morelos, cerca de Tepito, CDMX', estado: 'en_atencion' as const, prioridad: 'urgente' as const },
    { asociadoIdx: 3, tipoPercance: 'accidente' as const, descripcion: 'Colisión lateral con taxi en el cruce de Reforma y Bucareli. Testigos presentes.', latitud: 19.4270, longitud: -99.1510, direccionAprox: 'Reforma y Bucareli, Col. Juárez, CDMX', estado: 'resuelto' as const, prioridad: 'alta' as const },
    { asociadoIdx: 4, tipoPercance: 'robo' as const, descripcion: 'Robo de autopartes (espejos laterales y emblema) durante la noche. El vehículo estaba estacionado.', latitud: 19.3980, longitud: -99.1570, direccionAprox: 'Col. Narvarte Poniente, CDMX', estado: 'abierto' as const, prioridad: 'media' as const },
    { asociadoIdx: 5, tipoPercance: 'infraccion' as const, descripcion: 'Multa por Hoy No Circula. El asociado alega que su holograma está vigente pero el sistema fotográfico lo registró.', latitud: 19.4100, longitud: -99.1670, direccionAprox: 'Viaducto Miguel Alemán, CDMX', estado: 'escalado' as const, prioridad: 'baja' as const },
    { asociadoIdx: 6, tipoPercance: 'accidente' as const, descripcion: 'Bache causó daño en suspensión delantera. Se levantó reporte a la delegación. Requiere apoyo para reclamación.', latitud: 19.3550, longitud: -99.1300, direccionAprox: 'Calz. de Tlalpan, Col. Country Club, CDMX', estado: 'cerrado' as const, prioridad: 'baja' as const },
    { asociadoIdx: 7, tipoPercance: 'otro' as const, descripcion: 'Problema con la app de plataforma que desactivó su cuenta sin explicación. Necesita asesoría laboral.', latitud: 19.4326, longitud: -99.1332, direccionAprox: 'Centro Histórico, CDMX', estado: 'resuelto' as const, prioridad: 'media' as const },
  ];

  const casos: any[] = [];
  for (let i = 0; i < casosData.length; i++) {
    const c = casosData[i];
    const diasAtras = Math.floor(Math.random() * 30) + 1;
    const fechaApertura = new Date(Date.now() - diasAtras * 24 * 60 * 60 * 1000);

    const casoData: any = {
      codigo: `CAS-${(2026000 + i + 1).toString()}`,
      asociadoId: asociados[c.asociadoIdx].id,
      tipoPercance: c.tipoPercance,
      descripcion: c.descripcion,
      latitud: c.latitud,
      longitud: c.longitud,
      direccionAprox: c.direccionAprox,
      estado: c.estado,
      prioridad: c.prioridad,
      fechaApertura,
    };

    // Asignar abogado a casos no abiertos
    if (c.estado !== 'abierto') {
      casoData.abogadoId = abogadoProveedores[i % abogadoProveedores.length].id;
      casoData.fechaAsignacion = new Date(fechaApertura.getTime() + 2 * 60 * 60 * 1000);
    }

    if (['resuelto', 'cerrado'].includes(c.estado)) {
      casoData.fechaCierre = new Date(fechaApertura.getTime() + (Math.random() * 10 + 2) * 24 * 60 * 60 * 1000);
    }

    const caso = await prisma.casoLegal.create({ data: casoData });
    casos.push(caso);
  }
  console.log(`✓ ${casos.length} casos legales creados`);

  // ── NOTAS DE CASOS ──
  const notasData = [
    { casoIdx: 0, contenido: 'Se recibió reporte del asociado. Se solicitan fotografías del siniestro.', esPrivada: false },
    { casoIdx: 0, contenido: 'El asociado envió fotos. Daño estimado en $15,000 MXN.', esPrivada: false },
    { casoIdx: 1, contenido: 'Se asignó abogado. Se revisará la señalización del cruce para impugnar la multa.', esPrivada: false },
    { casoIdx: 1, contenido: 'NOTA INTERNA: Verificar si hay cámaras de C5 en la zona para solicitar video.', esPrivada: true },
    { casoIdx: 2, contenido: 'Caso URGENTE. Se levantó denuncia ante MP. El asociado está bien físicamente.', esPrivada: false },
    { casoIdx: 2, contenido: 'Se acompañó al asociado a ratificar denuncia. Folio MP: FED/2026/0123.', esPrivada: false },
    { casoIdx: 2, contenido: 'NOTA INTERNA: Coordinar con seguro del asociado para trámite de reposición de celular.', esPrivada: true },
    { casoIdx: 3, contenido: 'Se presentó ante el ajustador de seguros. Dictamen favorable para nuestro asociado.', esPrivada: false },
    { casoIdx: 3, contenido: 'Seguro aprobó reparación. El caso se da por resuelto.', esPrivada: false },
    { casoIdx: 4, contenido: 'Se levantó denuncia por robo de autopartes. El asociado proporcionó factura de compra.', esPrivada: false },
    { casoIdx: 5, contenido: 'Se solicitó revisión del holograma ante SEDEMA. Trámite en proceso.', esPrivada: false },
    { casoIdx: 5, contenido: 'SEDEMA no responde. Se escaló a supervisor.', esPrivada: false },
    { casoIdx: 6, contenido: 'Se presentó reclamación ante la alcaldía Coyoacán. Presupuesto de reparación: $4,500 MXN.', esPrivada: false },
    { casoIdx: 6, contenido: 'La alcaldía emitió orden de pago. Caso cerrado satisfactoriamente.', esPrivada: false },
    { casoIdx: 7, contenido: 'Se envió carta legal a la plataforma solicitando reactivación de cuenta.', esPrivada: false },
    { casoIdx: 7, contenido: 'La plataforma reactivó la cuenta del asociado tras la carta. Caso resuelto.', esPrivada: false },
  ];

  for (const n of notasData) {
    await prisma.notaCaso.create({
      data: {
        casoId: casos[n.casoIdx].id,
        autorId: n.esPrivada ? admin.id : operador.id,
        contenido: n.contenido,
        esPrivada: n.esPrivada,
      },
    });
  }
  console.log(`✓ ${notasData.length} notas de casos creadas`);

  // ── MENÚ (con encoding UTF-8 correcto) ──
  const menuItems = [
    { codigo: 'dashboard', titulo: 'Dashboard', ruta: '/dashboard', icono: 'LayoutDashboard', permisos: ['admin', 'operador', 'proveedor'], orden: 1 },
    { codigo: 'asociados', titulo: 'Asociados', ruta: '/asociados', icono: 'Users', permisos: ['admin', 'operador'], orden: 2 },
    { codigo: 'proveedores', titulo: 'Proveedores', ruta: '/proveedores', icono: 'Building2', permisos: ['admin', 'operador'], orden: 3 },
    { codigo: 'promociones', titulo: 'Promociones', ruta: '/promociones', icono: 'Tag', permisos: ['admin', 'operador', 'proveedor'], orden: 4 },
    { codigo: 'cupones', titulo: 'Cupones', ruta: '/cupones', icono: 'Ticket', permisos: ['admin', 'operador', 'proveedor'], orden: 5 },
    { codigo: 'casos-legales', titulo: 'Casos Legales', ruta: '/casos-legales', icono: 'Scale', permisos: ['admin', 'operador'], orden: 6 },
    { codigo: 'reportes', titulo: 'Reportes', ruta: '/reportes', icono: 'BarChart3', permisos: ['admin'], orden: 7 },
    { codigo: 'configuracion', titulo: 'Configuraci\u00f3n', ruta: '/configuracion', icono: 'Settings', permisos: ['admin'], orden: 8 },
  ];

  for (const item of menuItems) {
    await prisma.moduloMenu.upsert({
      where: { codigo: item.codigo },
      update: { titulo: item.titulo, ruta: item.ruta, icono: item.icono, permisos: item.permisos, orden: item.orden },
      create: item,
    });
  }
  console.log(`✓ ${menuItems.length} items de menú creados/actualizados`);

  console.log('\n=== SEED DEMO COMPLETADO ===');
  console.log('Resumen:');
  console.log(`  - 3 usuarios (admin, operador, proveedor)`);
  console.log(`  - ${proveedores.length} proveedores (talleres, comida, abogados, lavado, capacitación)`);
  console.log(`  - ${asociados.length} asociados (8 activos, 3 pendientes, 1 suspendido)`);
  console.log(`  - ${asociados.length} vehículos`);
  console.log(`  - ${promociones.length} promociones (7 activas, 1 pausada)`);
  console.log(`  - 28 cupones (8 activos, 15 canjeados, 5 vencidos)`);
  console.log(`  - ${casos.length} casos legales (variados estados y prioridades)`);
  console.log(`  - ${notasData.length} notas de seguimiento`);
  console.log(`  - ${menuItems.length} items de menú`);
}

main()
  .catch((e) => {
    console.error('Error en seed demo:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
