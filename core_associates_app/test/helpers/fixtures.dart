// Shared JSON fixtures for tests.

const asociadoJson = <String, dynamic>{
  'id': 'uuid-1',
  'idUnico': 'ASC-0001',
  'nombre': 'Juan',
  'apellidoPat': 'Pérez',
  'apellidoMat': 'López',
  'telefono': '+525512345678',
  'email': 'juan@example.com',
  'fechaNacimiento': '1990-01-15',
  'fotoUrl': 'https://example.com/foto.jpg',
  'estado': 'activo',
  'fechaRegistro': '2026-01-01T00:00:00.000Z',
  'vehiculos': [vehiculoJson],
};

const asociadoMinimalJson = <String, dynamic>{
  'id': 'uuid-2',
  'idUnico': 'ASC-0002',
  'telefono': '+525500000000',
  'estado': 'pendiente',
};

const vehiculoJson = <String, dynamic>{
  'id': 'v-1',
  'marca': 'Toyota',
  'modelo': 'Corolla',
  'anio': 2020,
  'color': 'Blanco',
  'placas': 'ABC-123',
  'numeroSerie': '1HGBH41JXMN109186',
  'esPrincipal': true,
};

const proveedorResumenJson = <String, dynamic>{
  'id': 'prov-1',
  'razonSocial': 'El Rápido S.A.',
  'tipo': 'taller',
  'logotipoUrl': 'https://example.com/logo.png',
};

const promocionJson = <String, dynamic>{
  'id': 'promo-1',
  'titulo': '20% en cambio de aceite',
  'descripcion': 'Descuento en cambio de aceite sintético',
  'tipoDescuento': 'porcentaje',
  'valorDescuento': 20.0,
  'fechaInicio': '2026-01-01',
  'fechaFin': '2026-12-31',
  'vigenciaCupon': 7,
  'terminos': 'Aplican restricciones',
  'imagenUrl': 'https://example.com/promo.jpg',
  'maxCupones': 100,
  'estado': 'activa',
  'proveedor': proveedorResumenJson,
};

const promocionMontoJson = <String, dynamic>{
  'id': 'promo-2',
  'titulo': '\$200 en alineación',
  'descripcion': 'Descuento fijo en alineación y balanceo',
  'tipoDescuento': 'monto',
  'valorDescuento': 200.0,
  'fechaInicio': '2026-02-01',
  'fechaFin': '2026-06-30',
  'vigenciaCupon': 14,
  'estado': 'activa',
  'proveedor': proveedorResumenJson,
};

const cuponPromocionJson = <String, dynamic>{
  'titulo': '20% en cambio de aceite',
  'tipoDescuento': 'porcentaje',
  'valorDescuento': 20.0,
};

const cuponProveedorJson = <String, dynamic>{
  'razonSocial': 'El Rápido S.A.',
  'tipo': 'taller',
};

const cuponJson = <String, dynamic>{
  'id': 'cup-1',
  'codigo': 'CUP-ABC123',
  'qrPayload': '{"code":"CUP-ABC123"}',
  'qrFirma': 'firma-hash-xyz',
  'estado': 'activo',
  'fechaGeneracion': '2026-02-20T10:00:00.000Z',
  'fechaVencimiento': '2026-02-27T10:00:00.000Z',
  'promocion': cuponPromocionJson,
  'proveedor': cuponProveedorJson,
};

const cuponCanjeadoJson = <String, dynamic>{
  'id': 'cup-2',
  'codigo': 'CUP-DEF456',
  'qrPayload': '{"code":"CUP-DEF456"}',
  'qrFirma': '',
  'estado': 'canjeado',
  'fechaGeneracion': '2026-02-15T10:00:00.000Z',
  'fechaVencimiento': '2026-02-22T10:00:00.000Z',
  'fechaCanje': '2026-02-18T14:30:00.000Z',
  'promocion': cuponPromocionJson,
  'proveedor': cuponProveedorJson,
};

const notaCasoJson = <String, dynamic>{
  'id': 'nota-1',
  'contenido': 'Se asignó abogado al caso.',
  'createdAt': '2026-02-20T12:00:00.000Z',
};

const casoLegalJson = <String, dynamic>{
  'id': 'caso-1',
  'codigo': 'LEG-001',
  'tipoPercance': 'accidente',
  'descripcion': 'Choque por alcance en Reforma',
  'latitud': 19.4326,
  'longitud': -99.1332,
  'direccionAprox': 'Av. Reforma 500',
  'estado': 'abierto',
  'prioridad': 'alta',
  'fechaApertura': '2026-02-20T08:00:00.000Z',
  'notas': [notaCasoJson],
};

const casoLegalMinimalJson = <String, dynamic>{
  'id': 'caso-2',
  'codigo': 'LEG-002',
  'tipoPercance': 'robo',
  'latitud': '19.4326',
  'longitud': '-99.1332',
  'estado': 'resuelto',
  'prioridad': 'media',
  'fechaApertura': '2026-02-10T08:00:00.000Z',
  'fechaCierre': '2026-02-15T18:00:00.000Z',
};

const documentoJson = <String, dynamic>{
  'id': 'doc-1',
  'tipo': 'ine_frente',
  'estado': 'aprobado',
  'contentType': 'image/jpeg',
  'fileSize': 1048576,
  'createdAt': '2026-02-01T00:00:00.000Z',
};

const documentoRechazadoJson = <String, dynamic>{
  'id': 'doc-2',
  'tipo': 'selfie',
  'estado': 'rechazado',
  'motivoRechazo': 'Imagen borrosa',
  'createdAt': '2026-02-02T00:00:00.000Z',
};
