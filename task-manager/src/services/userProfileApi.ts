import api from './api';
import type { UserProfileData, UserPreference, UserSession, UserSubscription } from '../types';

// ---- Profile ----
export const getProfile = () =>
  api.get<UserProfileData>('/perfil');

export const updateProfile = (data: {
  name?: string;
  apellido?: string;
  telefono?: string;
  avatar?: string;
}) => api.put<UserProfileData>('/perfil', data);

export const removeAvatar = () =>
  api.delete<UserProfileData>('/perfil/avatar');

// ---- Password ----
export const changePassword = (data: {
  currentPassword: string;
  newPassword: string;
}) => api.put<{ message: string }>('/perfil/password', data);

// ---- Preferences ----
export const getPreferences = () =>
  api.get<UserPreference>('/perfil/preferencias');

export const updatePreferences = (data: {
  idioma?: string;
  zonaHoraria?: string;
  notificacionesCorreo?: boolean;
  notificacionesSistema?: boolean;
  elementosPorPagina?: number;
}) => api.put<UserPreference>('/perfil/preferencias', data);

// ---- Sessions ----
export const getSessions = () =>
  api.get<UserSession[]>('/perfil/sesiones');

export const closeSession = (sessionId: number) =>
  api.put<{ message: string }>(`/perfil/sesiones/${sessionId}/cerrar`);

export const closeAllSessions = (currentSessionId?: number) =>
  api.put<{ message: string }>('/perfil/sesiones/cerrar-todas', null, {
    params: currentSessionId ? { currentSessionId } : undefined,
  });

// ---- Subscription ----
export const getSubscription = () =>
  api.get<UserSubscription>('/perfil/suscripcion');

export const updateSubscription = (data: {
  plan?: string;
  tarjetaUltimos4?: string;
  tarjetaExpiracion?: string;
}) => api.put<UserSubscription>('/perfil/suscripcion', data);

export const cancelSubscription = () =>
  api.put<{ message: string }>('/perfil/suscripcion/cancelar');

// ---- Account ----
export const deleteAccount = () =>
  api.delete<{ message: string }>('/perfil/cuenta');
