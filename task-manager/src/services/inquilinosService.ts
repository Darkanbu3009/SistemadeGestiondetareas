import type { Inquilino, InquilinoFormData } from '../types';

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

// Get all inquilinos (paginated)
export const getInquilinos = async (
  page: number = 0,
  size: number = 10,
  search?: string
): Promise<{ content: Inquilino[]; totalElements: number; totalPages: number }> => {
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
  });

  if (search) {
    params.append('search', search);
  }

  const response = await fetch(`${API_URL}/inquilinos?${params}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  return handleResponse(response);
};

// Get all inquilinos (no pagination)
export const getAllInquilinos = async (): Promise<Inquilino[]> => {
  const response = await fetch(`${API_URL}/inquilinos/all`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  return handleResponse(response);
};

// Get a single inquilino by ID
export const getInquilinoById = async (id: number): Promise<Inquilino> => {
  const response = await fetch(`${API_URL}/inquilinos/${id}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  return handleResponse(response);
};

// Create a new inquilino
export const createInquilino = async (data: InquilinoFormData): Promise<Inquilino> => {
  const response = await fetch(`${API_URL}/inquilinos`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  return handleResponse(response);
};

// Update an existing inquilino
export const updateInquilino = async (id: number, data: InquilinoFormData): Promise<Inquilino> => {
  const response = await fetch(`${API_URL}/inquilinos/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  return handleResponse(response);
};

// Delete an inquilino
export const deleteInquilino = async (id: number): Promise<void> => {
  const response = await fetch(`${API_URL}/inquilinos/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Error al eliminar' }));
    throw new Error(error.message || `Error: ${response.status}`);
  }
};

// Get inquilinos without property
export const getInquilinosSinPropiedad = async (): Promise<Inquilino[]> => {
  const response = await fetch(`${API_URL}/inquilinos/sin-propiedad`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  return handleResponse(response);
};

// Get inquilino count
export const getInquilinosCount = async (): Promise<number> => {
  const response = await fetch(`${API_URL}/inquilinos/stats/count`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  return handleResponse(response);
};

// Get active inquilinos count
export const getInquilinosActivosCount = async (): Promise<number> => {
  const response = await fetch(`${API_URL}/inquilinos/stats/count/activos`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  return handleResponse(response);
};
