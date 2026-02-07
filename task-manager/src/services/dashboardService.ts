import api from './api';
import type { DashboardStats, Pago, Propiedad } from '../types';

export const getDashboardStats = async (): Promise<DashboardStats> => {
  const response = await api.get<DashboardStats>('/dashboard/stats');
  return response.data;
};

export const getRentasPendientes = async (): Promise<Pago[]> => {
  const response = await api.get<Pago[]>('/dashboard/rentas-pendientes');
  return response.data;
};

export const getContratosProximosVencer = async () => {
  const response = await api.get('/dashboard/contratos-proximos-vencer');
  return response.data;
};

export const getPropiedadesDestacadas = async (): Promise<Propiedad[]> => {
  const response = await api.get<Propiedad[]>('/dashboard/propiedades-destacadas');
  return response.data;
};
