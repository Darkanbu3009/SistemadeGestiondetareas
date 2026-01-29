import type { Contrato, ContratoFormData } from '../types';

const API_URL = import.meta.env.VITE_API_URL || '/api';

// Helper to get auth headers
const getAuthHeaders = (): HeadersInit => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Handle API errors
const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Error de conexion' }));
    throw new Error(error.message || `Error: ${response.status}`);
  }
  return response.json();
};

// Get all contratos (paginated)
export const getContratos = async (
  page: number = 0,
  size: number = 10,
  search?: string,
  estado?: string
): Promise<{ content: Contrato[]; totalElements: number; totalPages: number }> => {
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
  });

  if (search) {
    params.append('search', search);
  }

  if (estado) {
    params.append('estado', estado);
  }

  const response = await fetch(`${API_URL}/contratos?${params}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  return handleResponse(response);
};

// Get all contratos (no pagination)
export const getAllContratos = async (): Promise<Contrato[]> => {
  const response = await fetch(`${API_URL}/contratos/all`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  return handleResponse(response);
};

// Get a single contrato by ID
export const getContratoById = async (id: number): Promise<Contrato> => {
  const response = await fetch(`${API_URL}/contratos/${id}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  return handleResponse(response);
};

// Get contratos by estado
export const getContratosByEstado = async (estado: string): Promise<Contrato[]> => {
  const response = await fetch(`${API_URL}/contratos/estado/${estado}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  return handleResponse(response);
};

// Get contratos proximos a vencer
export const getContratosProximosAVencer = async (days: number = 30): Promise<Contrato[]> => {
  const response = await fetch(`${API_URL}/contratos/proximos-a-vencer?days=${days}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  return handleResponse(response);
};

// Create a new contrato
export const createContrato = async (data: ContratoFormData): Promise<Contrato> => {
  const response = await fetch(`${API_URL}/contratos`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  return handleResponse(response);
};

// Update an existing contrato
export const updateContrato = async (id: number, data: ContratoFormData): Promise<Contrato> => {
  const response = await fetch(`${API_URL}/contratos/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  return handleResponse(response);
};

// Delete a contrato
export const deleteContrato = async (id: number): Promise<void> => {
  const response = await fetch(`${API_URL}/contratos/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Error al eliminar' }));
    throw new Error(error.message || `Error: ${response.status}`);
  }
};

// Firmar contrato (cambiar estado a activo)
export const firmarContrato = async (id: number): Promise<Contrato> => {
  const response = await fetch(`${API_URL}/contratos/${id}/firmar`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });

  return handleResponse(response);
};

// Finalizar contrato
export const finalizarContrato = async (id: number): Promise<Contrato> => {
  const response = await fetch(`${API_URL}/contratos/${id}/finalizar`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });

  return handleResponse(response);
};

// Get contrato count
export const getContratosCount = async (): Promise<number> => {
  const response = await fetch(`${API_URL}/contratos/stats/count`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  return handleResponse(response);
};

// Get contrato count by estado
export const getContratosCountByEstado = async (estado: string): Promise<number> => {
  const response = await fetch(`${API_URL}/contratos/stats/count/${estado}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  return handleResponse(response);
};
