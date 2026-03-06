import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { createHmac } from 'crypto';

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

  console.log('\u2713 Usuarios admin y operador creados');

  // ── PROVEEDORES ──
  const proveedoresData = [
    { idUnico: 'PRV-0001', razonSocial: 'Taller Mec\u00e1nico El R\u00e1pido', tipo: 'taller' as const, direccion: 'Av. Insurgentes Sur #1234, Col. Del Valle, CDMX', latitud: 19.3755, longitud: -99.1687, telefono: '+525512345678', email: 'contacto@elrapido.com', contactoNombre: 'Carlos M\u00e9ndez' },
    { idUnico: 'PRV-0002', razonSocial: 'Cocina Do\u00f1a Mary', tipo: 'comida' as const, direccion: 'Calle Sur #45, Col. Roma Norte, CDMX', latitud: 19.4195, longitud: -99.1616, telefono: '+525598765432', email: 'contacto@donamary.com', contactoNombre: 'Mar\u00eda L\u00f3pez' },
    { idUnico: 'PRV-0003', razonSocial: 'Despacho Jur\u00eddico Lex', tipo: 'abogado' as const, direccion: 'Av. Reforma #567, Col. Ju\u00e1rez, CDMX', latitud: 19.4270, longitud: -99.1580, telefono: '+525555123456', email: 'contacto@lexabogados.com', contactoNombre: 'Lic. Roberto Hern\u00e1ndez' },
    { idUnico: 'PRV-0004', razonSocial: 'AutoLavado Express', tipo: 'lavado' as const, direccion: 'Calz. de Tlalpan #890, Col. Portales, CDMX', latitud: 19.3615, longitud: -99.1440, telefono: '+525556789012', email: 'autolavado@express.com', contactoNombre: 'Pedro Ram\u00edrez' },
    { idUnico: 'PRV-0005', razonSocial: 'Capacitaci\u00f3n Vial MX', tipo: 'capacitacion' as const, direccion: 'Av. Universidad #321, Col. Narvarte, CDMX', latitud: 19.3890, longitud: -99.1550, telefono: '+525534567890', email: 'info@capacitacionvial.mx', contactoNombre: 'Ana Mart\u00ednez' },
    { idUnico: 'PRV-0006', razonSocial: 'Taller de Carrocer\u00eda Don Beto', tipo: 'taller' as const, direccion: 'Eje Central #456, Col. Doctores, CDMX', latitud: 19.4120, longitud: -99.1448, telefono: '+525578901234', email: 'donbeto@talleres.com', contactoNombre: 'Alberto Vega' },
    { idUnico: 'PRV-0007', razonSocial: 'Restaurante Los Compadres', tipo: 'comida' as const, direccion: 'Av. Coyoac\u00e1n #789, Col. Del Valle Sur, CDMX', latitud: 19.3685, longitud: -99.1630, telefono: '+525567890123', email: 'reservas@loscompadres.mx', contactoNombre: 'Javier Torres' },
    { idUnico: 'PRV-0008', razonSocial: 'Abogados Asociados del Centro', tipo: 'abogado' as const, direccion: 'Av. 5 de Mayo #234, Centro Hist\u00f3rico, CDMX', latitud: 19.4341, longitud: -99.1386, telefono: '+525589012345', email: 'contacto@abogadoscentro.com', contactoNombre: 'Lic. Patricia G\u00f3mez' },
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
  console.log(`\u2713 ${proveedores.length} proveedores creados`);

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
  console.log('\u2713 Usuarios proveedor creados');

  // ── ASOCIADOS ──
  const asociadosData = [
    { idUnico: 'ASC-0001', nombre: 'Juan', apellidoPat: 'P\u00e9rez', apellidoMat: 'Garc\u00eda', telefono: '+525510000001', email: 'juan.perez@email.com', fechaNacimiento: new Date('1990-03-15'), estado: 'activo' as const },
    { idUnico: 'ASC-0002', nombre: 'Mar\u00eda', apellidoPat: 'Gonz\u00e1lez', apellidoMat: 'L\u00f3pez', telefono: '+525510000002', email: 'maria.gonzalez@email.com', fechaNacimiento: new Date('1985-07-22'), estado: 'activo' as const },
    { idUnico: 'ASC-0003', nombre: 'Roberto', apellidoPat: 'Hern\u00e1ndez', apellidoMat: 'Mart\u00ednez', telefono: '+525510000003', email: 'roberto.hdez@email.com', fechaNacimiento: new Date('1992-11-08'), estado: 'activo' as const },
    { idUnico: 'ASC-0004', nombre: 'Ana Luc\u00eda', apellidoPat: 'Ram\u00edrez', apellidoMat: 'Soto', telefono: '+525510000004', email: 'ana.ramirez@email.com', fechaNacimiento: new Date('1988-01-30'), estado: 'activo' as const },
    { idUnico: 'ASC-0005', nombre: 'Carlos', apellidoPat: 'Mendoza', apellidoMat: 'R\u00edos', telefono: '+525510000005', email: 'carlos.mendoza@email.com', fechaNacimiento: new Date('1995-05-12'), estado: 'activo' as const },
    { idUnico: 'ASC-0006', nombre: 'Patricia', apellidoPat: 'Vega', apellidoMat: 'Cruz', telefono: '+525510000006', email: 'patricia.vega@email.com', fechaNacimiento: new Date('1993-09-18'), estado: 'activo' as const },
    { idUnico: 'ASC-0007', nombre: 'Miguel \u00c1ngel', apellidoPat: 'Torres', apellidoMat: 'D\u00edaz', telefono: '+525510000007', email: 'miguel.torres@email.com', fechaNacimiento: new Date('1987-04-25'), estado: 'activo' as const },
    { idUnico: 'ASC-0008', nombre: 'Fernanda', apellidoPat: 'Morales', apellidoMat: 'Jim\u00e9nez', telefono: '+525510000008', email: 'fernanda.morales@email.com', fechaNacimiento: new Date('1991-12-03'), estado: 'activo' as const },
    { idUnico: 'ASC-0009', nombre: 'Diego', apellidoPat: 'Castillo', apellidoMat: 'Rojas', telefono: '+525510000009', email: 'diego.castillo@email.com', fechaNacimiento: new Date('1994-08-14'), estado: 'pendiente' as const },
    { idUnico: 'ASC-0010', nombre: 'Gabriela', apellidoPat: 'Flores', apellidoMat: 'Ortiz', telefono: '+525510000010', email: 'gabriela.flores@email.com', fechaNacimiento: new Date('1989-06-27'), estado: 'pendiente' as const },
    { idUnico: 'ASC-0011', nombre: 'Andr\u00e9s', apellidoPat: 'Reyes', apellidoMat: 'Luna', telefono: '+525510000011', email: 'andres.reyes@email.com', fechaNacimiento: new Date('1996-02-09'), estado: 'pendiente' as const },
    { idUnico: 'ASC-0012', nombre: 'Laura', apellidoPat: 'Dom\u00ednguez', apellidoMat: 'N\u00fa\u00f1ez', telefono: '+525510000012', email: 'laura.dominguez@email.com', fechaNacimiento: new Date('1986-10-20'), estado: 'suspendido' as const },
  ];

  const asociados: any[] = [];
  for (const a of asociadosData) {
    const asoc = await prisma.asociado.upsert({
      where: { telefono: a.telefono },
      update: {},
      create: {
        ...a,
        fechaRegistro: new Date(Date.now() - Math.floor(Math.random() * 90) * 24 * 60 * 60 * 1000),
        fechaAprobacion: a.estado === 'activo' ? new Date(Date.now() - Math.floor(Math.random() * 60) * 24 * 60 * 60 * 1000) : undefined,
        aprobadoPorId: a.estado === 'activo' ? admin.id : undefined,
      },
    });
    asociados.push(asoc);
  }
  console.log(`\u2713 ${asociados.length} asociados creados`);

  // ── VEH\u00cdCULOS ──
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
    const existing = await prisma.vehiculo.findFirst({ where: { asociadoId: asociados[i].id } });
    if (!existing) {
      await prisma.vehiculo.create({
        data: { asociadoId: asociados[i].id, ...vehiculosData[i], esPrincipal: true },
      });
    }
  }
  console.log(`\u2713 ${asociados.length} veh\u00edculos creados`);

  // ── Limpiar datos demo previos ──
  await prisma.notaCaso.deleteMany({});
  await prisma.casoLegal.deleteMany({});
  await prisma.cupon.deleteMany({});
  await prisma.promocion.deleteMany({});
  console.log('\u2713 Datos demo previos limpiados');

  // ── PROMOCIONES ──
  const hoy = new Date();
  const en60dias = new Date(hoy.getTime() + 60 * 24 * 60 * 60 * 1000);
  const hace30dias = new Date(hoy.getTime() - 30 * 24 * 60 * 60 * 1000);

  const promocionesData = [
    { proveedorIdx: 0, titulo: '20% en Servicio Mayor', descripcion: 'Descuento del 20% en servicio mayor completo incluyendo cambio de aceite, filtros y revisi\u00f3n de frenos.', tipoDescuento: 'porcentaje' as const, valorDescuento: 20, vigenciaCupon: 48, maxCupones: 100, estado: 'activa' as const },
    { proveedorIdx: 0, titulo: '$200 de Descuento en Afinaci\u00f3n', descripcion: 'Descuento de $200 pesos en afinaci\u00f3n completa de 4 o 6 cilindros.', tipoDescuento: 'monto_fijo' as const, valorDescuento: 200, vigenciaCupon: 72, maxCupones: 50, estado: 'activa' as const },
    { proveedorIdx: 1, titulo: '15% en Comidas', descripcion: 'Descuento del 15% en cualquier platillo del men\u00fa. Incluye desayunos, comidas y cenas.', tipoDescuento: 'porcentaje' as const, valorDescuento: 15, vigenciaCupon: 24, maxCupones: 200, estado: 'activa' as const },
    { proveedorIdx: 3, titulo: 'Lavado Premium $99', descripcion: 'Lavado completo exterior e interior con encerado y aromatizado por solo $99 (precio regular $199).', tipoDescuento: 'monto_fijo' as const, valorDescuento: 100, vigenciaCupon: 48, maxCupones: 150, estado: 'activa' as const },
    { proveedorIdx: 4, titulo: '30% en Curso de Manejo Defensivo', descripcion: 'Descuento del 30% en el curso completo de manejo defensivo (16 horas). Incluye certificado.', tipoDescuento: 'porcentaje' as const, valorDescuento: 30, vigenciaCupon: 168, maxCupones: 30, estado: 'activa' as const },
    { proveedorIdx: 5, titulo: '25% en Reparaci\u00f3n de Carrocer\u00eda', descripcion: 'Descuento del 25% en cualquier trabajo de hojalatera y pintura. Presupuesto sin compromiso.', tipoDescuento: 'porcentaje' as const, valorDescuento: 25, vigenciaCupon: 72, maxCupones: 40, estado: 'activa' as const },
    { proveedorIdx: 6, titulo: '2x1 en Comida Corrida', descripcion: 'Al presentar el cup\u00f3n, obt\u00e9n 2 comidas corridas por el precio de 1. De lunes a viernes.', tipoDescuento: 'porcentaje' as const, valorDescuento: 50, vigenciaCupon: 24, maxCupones: 100, estado: 'activa' as const },
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
        terminos: 'V\u00e1lido solo para asociados activos de Core Associates. No acumulable con otras promociones.',
        maxCupones: p.maxCupones,
        estado: p.estado,
      },
    });
    promociones.push(promo);
  }
  console.log(`\u2713 ${promociones.length} promociones creadas`);

  // ── CUPONES ──
  const asociadosActivos = asociados.filter((a: any) => a.estado === 'activo');

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

    await prisma.cupon.create({
      data: {
        codigo, asociadoId: asoc.id, promocionId: promo.id, proveedorId: prov.id,
        qrPayload, qrFirma, estado: 'activo',
        fechaGeneracion: new Date(Date.now() - Math.floor(Math.random() * 24) * 60 * 60 * 1000),
        fechaVencimiento: venc,
      },
    });
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

    await prisma.cupon.create({
      data: {
        codigo, asociadoId: asoc.id, promocionId: promo.id, proveedorId: prov.id,
        qrPayload, qrFirma, estado: 'canjeado',
        fechaGeneracion: fechaGen,
        fechaVencimiento: new Date(fechaGen.getTime() + promo.vigenciaCupon * 60 * 60 * 1000),
        fechaCanje: new Date(fechaGen.getTime() + Math.floor(Math.random() * promo.vigenciaCupon) * 60 * 60 * 1000),
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
        codigo, asociadoId: asoc.id, promocionId: promo.id, proveedorId: prov.id,
        qrPayload, qrFirma, estado: 'vencido',
        fechaGeneracion: fechaGen,
        fechaVencimiento: new Date(fechaGen.getTime() + promo.vigenciaCupon * 60 * 60 * 1000),
      },
    });
  }

  console.log('\u2713 28 cupones creados (8 activos, 15 canjeados, 5 vencidos)');

  // ── CASOS LEGALES ──
  const abogadoProveedores = proveedores.filter((p: any) => p.tipo === 'abogado');

  const casosData = [
    { asociadoIdx: 0, tipoPercance: 'accidente' as const, descripcion: 'Choque por alcance en Perif\u00e9rico Sur a la altura de San Jer\u00f3nimo. Da\u00f1os en la parte trasera del veh\u00edculo.', latitud: 19.3453, longitud: -99.1890, direccionAprox: 'Perif\u00e9rico Sur, Col. San Jer\u00f3nimo, CDMX', estado: 'abierto' as const, prioridad: 'alta' as const },
    { asociadoIdx: 1, tipoPercance: 'infraccion' as const, descripcion: 'Infracci\u00f3n por supuesta vuelta prohibida en Eje Central y Fray Servando.', latitud: 19.4230, longitud: -99.1440, direccionAprox: 'Eje Central y Fray Servando, CDMX', estado: 'en_atencion' as const, prioridad: 'media' as const },
    { asociadoIdx: 2, tipoPercance: 'asalto' as const, descripcion: 'Asalto a mano armada mientras esperaba pasaje en la zona de Tepito. Le robaron celular y efectivo.', latitud: 19.4427, longitud: -99.1210, direccionAprox: 'Col. Morelos, cerca de Tepito, CDMX', estado: 'en_atencion' as const, prioridad: 'urgente' as const },
    { asociadoIdx: 3, tipoPercance: 'accidente' as const, descripcion: 'Colisi\u00f3n lateral con taxi en el cruce de Reforma y Bucareli. Testigos presentes.', latitud: 19.4270, longitud: -99.1510, direccionAprox: 'Reforma y Bucareli, Col. Ju\u00e1rez, CDMX', estado: 'resuelto' as const, prioridad: 'alta' as const },
    { asociadoIdx: 4, tipoPercance: 'robo' as const, descripcion: 'Robo de autopartes (espejos laterales y emblema) durante la noche. El veh\u00edculo estaba estacionado.', latitud: 19.3980, longitud: -99.1570, direccionAprox: 'Col. Narvarte Poniente, CDMX', estado: 'abierto' as const, prioridad: 'media' as const },
    { asociadoIdx: 5, tipoPercance: 'infraccion' as const, descripcion: 'Multa por Hoy No Circula. El asociado alega que su holograma est\u00e1 vigente.', latitud: 19.4100, longitud: -99.1670, direccionAprox: 'Viaducto Miguel Alem\u00e1n, CDMX', estado: 'escalado' as const, prioridad: 'baja' as const },
    { asociadoIdx: 6, tipoPercance: 'accidente' as const, descripcion: 'Bache caus\u00f3 da\u00f1o en suspensi\u00f3n delantera. Se levant\u00f3 reporte a la delegaci\u00f3n.', latitud: 19.3550, longitud: -99.1300, direccionAprox: 'Calz. de Tlalpan, Col. Country Club, CDMX', estado: 'cerrado' as const, prioridad: 'baja' as const },
    { asociadoIdx: 7, tipoPercance: 'otro' as const, descripcion: 'Problema con la app de plataforma que desactiv\u00f3 su cuenta sin explicaci\u00f3n. Necesita asesor\u00eda laboral.', latitud: 19.4326, longitud: -99.1332, direccionAprox: 'Centro Hist\u00f3rico, CDMX', estado: 'resuelto' as const, prioridad: 'media' as const },
  ];

  const casos: any[] = [];
  for (let i = 0; i < casosData.length; i++) {
    const c = casosData[i];
    const diasAtras = Math.floor(Math.random() * 30) + 1;
    const fechaApertura = new Date(Date.now() - diasAtras * 24 * 60 * 60 * 1000);

    const casoCreateData: any = {
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

    if (c.estado !== 'abierto') {
      casoCreateData.abogadoId = abogadoProveedores[i % abogadoProveedores.length].id;
      casoCreateData.fechaAsignacion = new Date(fechaApertura.getTime() + 2 * 60 * 60 * 1000);
    }

    if (['resuelto', 'cerrado'].includes(c.estado)) {
      casoCreateData.fechaCierre = new Date(fechaApertura.getTime() + (Math.floor(Math.random() * 10) + 2) * 24 * 60 * 60 * 1000);
    }

    const caso = await prisma.casoLegal.create({ data: casoCreateData });
    casos.push(caso);
  }
  console.log(`\u2713 ${casos.length} casos legales creados`);

  // ── NOTAS DE CASOS ──
  const notasData = [
    { casoIdx: 0, contenido: 'Se recibi\u00f3 reporte del asociado. Se solicitan fotograf\u00edas del siniestro.', esPrivada: false },
    { casoIdx: 0, contenido: 'El asociado envi\u00f3 fotos. Da\u00f1o estimado en $15,000 MXN.', esPrivada: false },
    { casoIdx: 1, contenido: 'Se asign\u00f3 abogado. Se revisar\u00e1 la se\u00f1alizaci\u00f3n del cruce para impugnar la multa.', esPrivada: false },
    { casoIdx: 1, contenido: 'NOTA INTERNA: Verificar si hay c\u00e1maras de C5 en la zona para solicitar video.', esPrivada: true },
    { casoIdx: 2, contenido: 'Caso URGENTE. Se levant\u00f3 denuncia ante MP. El asociado est\u00e1 bien f\u00edsicamente.', esPrivada: false },
    { casoIdx: 2, contenido: 'Se acompa\u00f1\u00f3 al asociado a ratificar denuncia. Folio MP: FED/2026/0123.', esPrivada: false },
    { casoIdx: 2, contenido: 'NOTA INTERNA: Coordinar con seguro del asociado para tr\u00e1mite de reposici\u00f3n de celular.', esPrivada: true },
    { casoIdx: 3, contenido: 'Se present\u00f3 ante el ajustador de seguros. Dictamen favorable para nuestro asociado.', esPrivada: false },
    { casoIdx: 3, contenido: 'Seguro aprob\u00f3 reparaci\u00f3n. El caso se da por resuelto.', esPrivada: false },
    { casoIdx: 4, contenido: 'Se levant\u00f3 denuncia por robo de autopartes. El asociado proporcion\u00f3 factura de compra.', esPrivada: false },
    { casoIdx: 5, contenido: 'Se solicit\u00f3 revisi\u00f3n del holograma ante SEDEMA. Tr\u00e1mite en proceso.', esPrivada: false },
    { casoIdx: 5, contenido: 'SEDEMA no responde. Se escal\u00f3 a supervisor.', esPrivada: false },
    { casoIdx: 6, contenido: 'Se present\u00f3 reclamaci\u00f3n ante la alcald\u00eda Coyoac\u00e1n. Presupuesto de reparaci\u00f3n: $4,500 MXN.', esPrivada: false },
    { casoIdx: 6, contenido: 'La alcald\u00eda emiti\u00f3 orden de pago. Caso cerrado satisfactoriamente.', esPrivada: false },
    { casoIdx: 7, contenido: 'Se envi\u00f3 carta legal a la plataforma solicitando reactivaci\u00f3n de cuenta.', esPrivada: false },
    { casoIdx: 7, contenido: 'La plataforma reactiv\u00f3 la cuenta del asociado tras la carta. Caso resuelto.', esPrivada: false },
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
  console.log(`\u2713 ${notasData.length} notas de casos creadas`);

  // ── MEN\u00da (con encoding UTF-8 correcto) ──
  const menuItems = [
    { codigo: 'dashboard', titulo: 'Dashboard', ruta: '/dashboard', icono: 'LayoutDashboard', permisos: ['admin', 'operador', 'proveedor'], orden: 1 },
    { codigo: 'asociados', titulo: 'Asociados', ruta: '/asociados', icono: 'Users', permisos: ['admin', 'operador'], orden: 2 },
    { codigo: 'proveedores', titulo: 'Proveedores', ruta: '/proveedores', icono: 'Building2', permisos: ['admin', 'operador'], orden: 3 },
    { codigo: 'promociones', titulo: 'Promociones', ruta: '/promociones', icono: 'Tag', permisos: ['admin', 'operador', 'proveedor'], orden: 4 },
    { codigo: 'cupones', titulo: 'Cupones', ruta: '/cupones', icono: 'Ticket', permisos: ['admin', 'operador', 'proveedor'], orden: 5 },
    { codigo: 'casos-legales', titulo: 'Casos Legales', ruta: '/casos-legales', icono: 'Scale', permisos: ['admin', 'operador'], orden: 6 },
    { codigo: 'mapa-sos', titulo: 'Mapa SOS', ruta: '/mapa-sos', icono: 'MapPinned', permisos: ['admin', 'operador'], orden: 7 },
    { codigo: 'reportes', titulo: 'Reportes', ruta: '/reportes', icono: 'BarChart3', permisos: ['admin'], orden: 8 },
    { codigo: 'configuracion', titulo: 'Configuraci\u00f3n', ruta: '/configuracion', icono: 'Settings', permisos: ['admin'], orden: 9 },
  ];

  for (const item of menuItems) {
    await prisma.moduloMenu.upsert({
      where: { codigo: item.codigo },
      update: { titulo: item.titulo, ruta: item.ruta, icono: item.icono, permisos: item.permisos, orden: item.orden },
      create: item,
    });
  }
  console.log(`\u2713 ${menuItems.length} items de men\u00fa creados/actualizados`);

  console.log('\n=== SEED DEMO COMPLETADO ===');
  console.log('Resumen:');
  console.log('  - 3 usuarios (admin, operador, proveedor)');
  console.log(`  - ${proveedores.length} proveedores (talleres, comida, abogados, lavado, capacitaci\u00f3n)`);
  console.log(`  - ${asociados.length} asociados (8 activos, 3 pendientes, 1 suspendido)`);
  console.log(`  - ${asociados.length} veh\u00edculos`);
  console.log(`  - ${promociones.length} promociones (7 activas, 1 pausada)`);
  console.log('  - 28 cupones (8 activos, 15 canjeados, 5 vencidos)');
  console.log(`  - ${casos.length} casos legales (variados estados y prioridades)`);
  console.log(`  - ${notasData.length} notas de seguimiento`);
  console.log(`  - ${menuItems.length} items de men\u00fa`);
}

main()
  .catch((e) => {
    console.error('Error en seed demo:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
