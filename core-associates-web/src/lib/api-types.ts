// Menu
export interface MenuItem {
  id: string;
  codigo: string;
  titulo: string;
  ruta: string | null;
  icono: string | null;
  permisos: string[];
  orden: number;
  tipo: 'enlace' | 'seccion' | 'separador';
  visible: boolean;
  children: MenuItem[];
}

// Auth
export interface User {
  id: string;
  email: string;
  nombre: string;
  rol: 'admin' | 'operador' | 'proveedor';
}

// Asociado
export interface Asociado {
  id: string;
  idUnico: string;
  nombre: string;
  apellidoPat: string;
  apellidoMat: string | null;
  telefono: string;
  email: string | null;
  fechaNacimiento: string;
  fotoUrl: string | null;
  estado: 'pendiente' | 'activo' | 'suspendido' | 'baja' | 'rechazado';
  fechaRegistro: string;
  fechaAprobacion: string | null;
  createdAt: string;
  vehiculos?: Vehiculo[];
  documentos?: Documento[];
  cupones?: Cupon[];
  casosLegales?: CasoLegal[];
  _count?: {
    vehiculos: number;
    documentos: number;
    cupones: number;
  };
}

// Vehiculo
export interface Vehiculo {
  id: string;
  marca: string;
  modelo: string;
  anio: number;
  color: string;
  placas: string;
  numeroSerie: string | null;
  esPrincipal: boolean;
}

// Documento
export interface Documento {
  id: string;
  tipo: 'ine_frente' | 'ine_reverso' | 'selfie' | 'tarjeta_circulacion' | 'otro';
  estado: 'pendiente' | 'aprobado' | 'rechazado';
  contentType: string;
  fileSize: number;
  motivoRechazo: string | null;
  createdAt: string;
}

// Proveedor
export interface Proveedor {
  id: string;
  idUnico: string;
  razonSocial: string;
  tipo: 'abogado' | 'comida' | 'taller' | 'lavado' | 'capacitacion' | 'otro';
  direccion: string | null;
  telefono: string | null;
  email: string | null;
  contactoNombre: string | null;
  estado: 'activo' | 'inactivo';
  createdAt: string;
  promociones?: Promocion[];
  _count?: {
    promociones: number;
    cuponesEmitidos: number;
    cuponesCanjeados?: number;
  };
}

// Promocion
export interface Promocion {
  id: string;
  proveedorId: string;
  titulo: string;
  descripcion: string;
  tipoDescuento: 'porcentaje' | 'monto_fijo';
  valorDescuento: number;
  fechaInicio: string;
  fechaFin: string;
  vigenciaCupon: number;
  terminos: string | null;
  imagenUrl: string | null;
  maxCupones: number | null;
  estado: 'activa' | 'pausada' | 'finalizada';
  createdAt: string;
  proveedor?: Proveedor;
  _count?: {
    cupones: number;
  };
}

// Cupon
export interface Cupon {
  id: string;
  codigo: string;
  asociadoId: string;
  estado: 'activo' | 'canjeado' | 'vencido' | 'cancelado';
  fechaGeneracion: string;
  fechaVencimiento: string;
  fechaCanje: string | null;
  asociado?: {
    idUnico: string;
    nombre: string;
    apellidoPat: string;
  };
  promocion?: Promocion;
  proveedor?: Proveedor;
}

// NotaCaso
export interface NotaCaso {
  id: string;
  contenido: string;
  esPrivada: boolean;
  createdAt: string;
  autor?: {
    nombre: string;
    rol: string;
  };
}

// CasoLegal
export interface CasoLegal {
  id: string;
  codigo: string;
  tipoPercance: 'accidente' | 'infraccion' | 'robo' | 'asalto' | 'otro';
  descripcion: string | null;
  latitud: number;
  longitud: number;
  direccionAprox: string | null;
  estado: 'abierto' | 'en_atencion' | 'escalado' | 'resuelto' | 'cerrado' | 'cancelado';
  prioridad: 'baja' | 'media' | 'alta' | 'urgente';
  fechaApertura: string;
  fechaAsignacion: string | null;
  fechaCierre: string | null;
  asociadoId: string;
  abogadoId: string | null;
  asociado?: {
    idUnico: string;
    nombre: string;
    apellidoPat: string;
    telefono: string;
  };
  abogado?: {
    razonSocial: string;
    telefono?: string;
  };
  notas?: NotaCaso[];
  _count?: {
    notas: number;
  };
}

// Dashboard Metrics
export interface DashboardMetrics {
  asociados: {
    total: number;
    activos: number;
    pendientes: number;
    suspendidos: number;
    bajas: number;
    rechazados: number;
  };
  proveedores: {
    total: number;
    activos: number;
  };
  cupones: {
    delMes: number;
  };
  casosLegales: {
    abiertos: number;
  };
  documentos: {
    pendientes: number;
  };
  trend: {
    mes: string;
    asociados: number;
    cupones: number;
  }[];
}

// Reporte avanzado con filtros
export interface ReporteAvanzado {
  periodo: { desde: string | null; hasta: string | null };
  asociados: {
    registrados: number;
    porEstado: Record<string, number>;
  };
  cupones: {
    generados: number;
    porEstado: Record<string, number>;
  };
  casosLegales: {
    porTipo: Record<string, number>;
    porEstado: Record<string, number>;
  };
  documentos: {
    porEstado: Record<string, number>;
  };
  trend: {
    mes: string;
    asociados: number;
    cupones: number;
    casos: number;
  }[];
}

// Auditoría
export interface AuditoriaRecord {
  id: string;
  accion: string;
  entidad: string;
  entidadId: string;
  datosAnteriores: Record<string, unknown> | null;
  datosNuevos: Record<string, unknown> | null;
  ip: string | null;
  createdAt: string;
  usuario: {
    id: string;
    nombre: string;
    email: string;
    rol: string;
  } | null;
}

// Usuario CRM
export interface UsuarioCRM {
  id: string;
  email: string;
  nombre: string;
  rol: 'admin' | 'operador' | 'proveedor';
  estado: 'activo' | 'inactivo';
  ultimoAcceso: string | null;
  createdAt: string;
}
