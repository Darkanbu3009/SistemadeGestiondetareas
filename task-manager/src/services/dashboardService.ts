import api from './api';
import type { DashboardStats, Pago, Propiedad } from '../types';

export const getDashboardStats = async (month?: number, year?: number): Promise<DashboardStats> => {
  const params: Record<string, number> = {};
  if (month !== undefined) params.month = month;
  if (year !== undefined) params.year = year;
  const response = await api.get<DashboardStats>('/dashboard/stats', { params });
  return response.data;
};

export const getRentasPendientes = async (month?: number, year?: number): Promise<Pago[]> => {
  const params: Record<string, number> = {};
  if (month !== undefined) params.month = month;
  if (year !== undefined) params.year = year;
  const response = await api.get<Pago[]>('/dashboard/rentas-pendientes', { params });
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
