// Menu
export interface MenuItem {
  id: string;
  codigo: string;
  titulo: string;
  ruta: string | null;
  icono: string | null;
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
  rol: string;
  rolId?: string;
  rolNombre?: string;
  permisos?: string[];
  proveedorId?: string;
  avatarUrl?: string;
  temaId?: string | null;
}

// Temas
export interface Tema {
  id: string;
  nombre: string;
  categoria?: string | null;
  colores: Record<string, any>;
  fuente?: string | null;
  logoUrl?: string | null;
  esGlobal: boolean;
  creadoPor: string;
  creador?: { id: string; nombre: string };
  createdAt: string;
  updatedAt: string;
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
  motivoRechazo: string | null;
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
  fotoUrl: string | null;
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
  analisis?: AnalisisDocumento | null;
}

// Proveedor
export interface Proveedor {
  id: string;
  idUnico: string;
  razonSocial: string;
  tipo: 'abogado' | 'comida' | 'taller' | 'lavado' | 'capacitacion' | 'otro';
  direccion: string | null;
  latitud: number | null;
  longitud: number | null;
  telefono: string | null;
  email: string | null;
  contactoNombre: string | null;
  estado: 'activo' | 'inactivo';
  logotipoUrl: string | null;
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
  estado: 'activa' | 'pausada' | 'finalizada' | 'expirada';
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
  qrPayload?: string;
  qrFirma?: string;
  asociado?: {
    idUnico: string;
    nombre: string;
    apellidoPat: string;
  };
  promocion?: Promocion;
  proveedor?: Proveedor;
}

// NotaAsociado
export interface NotaAsociado {
  id: string;
  contenido: string;
  tipo: 'nota' | 'cambio_estado';
  metadatos: Record<string, string> | null;
  createdAt: string;
  autor?: {
    id: string;
    nombre: string;
    rol: string;
  };
}

// NotaCaso
export interface NotaCaso {
  id: string;
  casoId: string;
  autorId: string;
  contenido: string;
  esPrivada: boolean;
  createdAt: string;
  autor?: {
    id: string;
    nombre: string;
    rol: string;
  };
}

// DocumentoCaso
export interface DocumentoCaso {
  id: string;
  casoId: string;
  nombre: string;
  contentType: string;
  fileSize: number;
  createdAt: string;
  subidoPor?: {
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
  abogadoUsuarioId: string | null;
  asociado?: {
    id?: string;
    idUnico: string;
    nombre: string;
    apellidoPat: string;
    apellidoMat?: string | null;
    telefono: string;
    email?: string | null;
    fotoUrl?: string | null;
    _count?: { documentos: number };
    vehiculos?: Vehiculo[];
  };
  abogado?: {
    razonSocial: string;
    telefono?: string;
  };
  abogadoUsuario?: {
    id: string;
    nombre: string;
    email: string;
  };
  notas?: NotaCaso[];
  documentos?: DocumentoCaso[];
  distanciaKm?: number;
  _count?: {
    notas: number;
  };
}

export interface ZonaAbogado {
  zonaLatitud: number | null;
  zonaLongitud: number | null;
  zonaRadioKm: number | null;
  zonaEstado: string | null;
  zonaDescripcion: string | null;
  configurada: boolean;
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

export interface DashboardProveedorMetrics {
  promociones: {
    activas: number;
    pausadas: number;
    finalizadas: number;
    total: number;
  };
  cupones: {
    totales: number;
    canjeados: number;
    vencidos: number;
    delMes: number;
  };
  trend: {
    mes: string;
    emitidos: number;
    canjeados: number;
  }[];
}

export interface DashboardAbogadoMetrics {
  casos: {
    asignados: number;
    enAtencion: number;
    resueltos: number;
    escalados: number;
    disponibles: number;
    delMes: number;
  };
  notas: {
    delMes: number;
  };
  trend: {
    mes: string;
    asignados: number;
    resueltos: number;
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
  topProveedores: {
    id: string;
    razonSocial: string;
    tipo: string;
    cuponesEmitidos: number;
    cuponesCanjeados: number;
    promociones: number;
  }[];
  tiempoResolucionCasos: {
    mes: string;
    diasPromedio: number;
    casosResueltos: number;
  }[];
  tasaAprobacion: {
    mes: string;
    tasa: number;
    aprobados: number;
    registrados: number;
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
  rol: 'admin' | 'operador' | 'proveedor' | 'abogado';
  rolId?: string;
  proveedorId?: string;
  avatarUrl?: string | null;
  temaId?: string | null;
  estado: 'activo' | 'inactivo';
  ultimoAcceso: string | null;
  createdAt: string;
}

// Roles & Permisos
export interface Rol {
  id: string;
  nombre: string;
  descripcion: string | null;
  icono: string | null;
  color: string | null;
  esProtegido: boolean;
  esPorDefecto: boolean;
  temaIdPorDefecto: string | null;
  permisos: { permiso: Permiso }[];
  _count: { usuarios: number };
}

export interface RolMenuItem {
  rolId: string;
  moduloMenuId: string;
  orden: number;
  moduloMenu: MenuItem;
}

export interface Permiso {
  id: string;
  codigo: string;
  grupo: string;
  descripcion: string | null;
}

// AI Analysis
export interface AnalisisDocumento {
  id: string;
  estado: 'procesando' | 'completado' | 'error';
  confianza: number | null;
  datosExtraidos: Record<string, { valor: string | boolean; confianza: number }> | null;
  validaciones: Record<string, boolean> | null;
  errorMsg?: string | null;
  createdAt: string;
}

// Documento with AI analysis
export interface DocumentoConAnalisis extends Documento {
  analisis?: AnalisisDocumento | null;
  asociado?: {
    id: string;
    idUnico: string;
    nombre: string;
    apellidoPat: string;
    telefono: string;
  };
}

// AI Config
export interface ConfiguracionIA {
  id: string;
  clave: string;
  nombre: string;
  provider: string;
  modelo: string;
  apiKey: string | null;
  promptSistema: string | null;
  temperatura: number;
  maxTokens: number;
  activo: boolean;
  umbralAutoAprobacion: number;
  umbralAutoRechazo: number;
  maxRechazosPreval: number;
  horasBloqueoPreval: number;
  chatbotActivo: boolean;
  modoAvanzadoDisponible: boolean;
  maxPreguntasPorHora: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChatbotStatus {
  chatbotActivo: boolean;
  modoAvanzadoDisponible: boolean;
  maxPreguntasPorHora: number;
}

// Notificación CRM (para usuarios del panel)
export interface NotificacionCRM {
  id: string;
  usuarioId: string;
  titulo: string;
  mensaje: string;
  tipo: string;
  referenciaId: string | null;
  referenciaTipo: string | null;
  leida: boolean;
  createdAt: string;
}

// Abogado CRM
export interface AbogadoCRM {
  id: string;
  email: string;
  nombre: string;
  rol: string;
  estado: 'activo' | 'inactivo';
  avatarUrl: string | null;
  especialidad: string | null;
  cedulaProfesional: string | null;
  telefono: string | null;
  direccion: string | null;
  ultimoAcceso: string | null;
  createdAt: string;
  _count: { casosComoAbogado: number };
  casosBreakdown: Record<string, number>;
}

export interface AbogadoDetalle extends AbogadoCRM {
  proveedor: Proveedor | null;
  casosRecientes: CasoLegal[];
}
