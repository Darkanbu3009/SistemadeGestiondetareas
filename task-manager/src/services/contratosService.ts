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

// Helper to get auth headers for file upload (sin Content-Type)
const getAuthHeadersForUpload = (): HeadersInit => {
  const token = localStorage.getItem('token');
  return {
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

  const url = `${API_URL}/contratos?${params}`;
  console.log('Fetching contratos from:', url);

  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  console.log('Get contratos response status:', response.status);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Error de conexion' }));
    console.error('Get contratos error:', errorData);
    throw new Error(errorData.message || `Error: ${response.status}`);
  }

  const result = await response.json();
  console.log('Contratos result:', result);
  return result;
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

// Create a new contrato
export const createContrato = async (data: ContratoFormData): Promise<Contrato> => {
  console.log('Creating contrato with data:', data);
  console.log('API URL:', `${API_URL}/contratos`);
  console.log('Auth headers:', getAuthHeaders());

  const response = await fetch(`${API_URL}/contratos`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  console.log('Create contrato response status:', response.status);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Error de conexion' }));
    console.error('Create contrato error:', errorData);
    throw new Error(errorData.message || `Error: ${response.status}`);
  }

  const result = await response.json();
  console.log('Created contrato:', result);
  return result;
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

// ============================================
// NUEVAS FUNCIONES AGREGADAS
// ============================================

// Upload PDF document for a contrato
export const uploadContratoPdf = async (id: number, file: File): Promise<Contrato> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_URL}/contratos/${id}/upload-pdf`, {
    method: 'POST',
    headers: getAuthHeadersForUpload(),
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Error al subir PDF' }));
    console.error('Upload PDF error:', errorData);
    throw new Error(errorData.message || `Error: ${response.status}`);
  }

  return response.json();
};

// Update contrato estado
export const updateContratoEstado = async (id: number, estado: string): Promise<Contrato> => {
  const response = await fetch(`${API_URL}/contratos/${id}/estado`, {
    method: 'PATCH',
    headers: getAuthHeaders(),
    body: JSON.stringify({ estado }),
  });

  return handleResponse(response);
};

// ============================================
// FIN DE NUEVAS FUNCIONES
// ============================================

// Firmar a contrato
export const firmarContrato = async (id: number): Promise<Contrato> => {
  const response = await fetch(`${API_URL}/contratos/${id}/firmar`, {
    method: 'POST',
    headers: getAuthHeaders(),
  });

  return handleResponse(response);
};

// Finalizar a contrato
export const finalizarContrato = async (id: number): Promise<Contrato> => {
  const response = await fetch(`${API_URL}/contratos/${id}/finalizar`, {
    method: 'POST',
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

// Get contratos by estado
export const getContratosByEstado = async (estado: string): Promise<Contrato[]> => {
  const response = await fetch(`${API_URL}/contratos/estado/${estado}`, {
    method: 'GET',
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
