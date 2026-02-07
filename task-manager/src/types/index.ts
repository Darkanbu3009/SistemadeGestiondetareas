// Types for Zelvoria Property Management System
export interface User {
  id: number;
  name: string;
  apellido?: string;
  email: string;
  telefono?: string;
  avatar?: string;
  role?: string;
}

// User Profile types
export interface UserProfileData {
  id: number;
  name: string;
  apellido?: string;
  email: string;
  telefono?: string;
  avatar?: string;
  role?: string;
}

export interface UserPreference {
  id: number;
  idioma: string;
  zonaHoraria: string;
  notificacionesCorreo: boolean;
  notificacionesSistema: boolean;
  elementosPorPagina: number;
}

export interface UserSession {
  id: number;
  ubicacion: string;
  ciudad: string;
  ipAddress: string;
  dispositivo: string;
  activa: boolean;
  fechaInicio: string;
}

export interface UserSubscription {
  id: number;
  plan: string;
  estado: string;
  tarjetaUltimos4?: string;
  tarjetaExpiracion?: string;
  proximoPago?: string;
}

export type ProfilePageType = 'perfil' | 'seguridad' | 'notificaciones' | 'preferencias' | 'suscripcion' | 'historial';

export interface Propiedad {
  id: number;
  nombre: string;
  direccion: string;
  ciudad: string;
  pais: string;
  tipo: 'apartamento' | 'casa' | 'local' | 'oficina' | 'otro';
  rentaMensual: number;
  estado: 'disponible' | 'ocupada' | 'mantenimiento' | 'reservada';
  imagen?: string;
  inquilinoId?: number;
  inquilino?: Inquilino;
  createdAt: string;
  updatedAt: string;
}

export interface Inquilino {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  documento: string;
  avatar?: string;
  propiedadId?: number;
  propiedad?: Propiedad;
  contratoEstado?: 'activo' | 'en_proceso' | 'finalizado' | 'sin_contrato';
  contratoFin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Pago {
  id: number;
  inquilinoId: number;
  inquilino?: Inquilino;
  propiedadId: number;
  propiedad?: Propiedad;
  monto: number;
  estado: 'pagado' | 'pendiente' | 'atrasado';
  fechaVencimiento: string;
  fechaPago?: string;
  diasAtrasado?: number;
  comprobante?: string;
  createdAt: string;
  updatedAt: string;
}

// Estados de contrato actualizados
export type ContratoEstado = 'sin_firmar' | 'en_proceso' | 'firmado' | 'activo' | 'por_vencer' | 'finalizado';

export interface Contrato {
  id: number;
  inquilinoId: number;
  inquilino?: Inquilino;
  propiedadId: number;
  propiedad?: Propiedad;
  fechaInicio: string;
  fechaFin: string;
  rentaMensual: number;
  estado: ContratoEstado;
  pdfUrl?: string;
  diasRestantes?: number;
  createdAt: string;
  updatedAt: string;
}

// Dashboard summary types
export interface DashboardStats {
  ingresosMes: number;
  ingresosVariacion: number;
  rentasPendientes: number;
  totalPropiedades: number;
  inquilinosActivos: number;
  morosos: number;
}

export interface RentaPendiente {
  id: number;
  inquilino: Inquilino;
  propiedad: Propiedad;
  renta: number;
  diasAtrasada: number;
}

// Form types
export interface PropiedadFormData {
  nombre: string;
  direccion: string;
  ciudad: string;
  pais: string;
  tipo: Propiedad['tipo'];
  rentaMensual: number;
  estado: Propiedad['estado'];
  imagen?: string;
}

export interface InquilinoFormData {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  documento: string;
  avatar?: string;
  propiedadId?: number;
}

export interface PagoFormData {
  inquilinoId: number;
  propiedadId: number;
  monto: number;
  fechaPago: string;
  comprobante?: string;
  estado?: string;
}

export interface ContratoFormData {
  inquilinoId: number;
  propiedadId: number;
  fechaInicio: string;
  fechaFin: string;
  rentaMensual: number;
  estado?: ContratoEstado;
  pdfUrl?: string;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
