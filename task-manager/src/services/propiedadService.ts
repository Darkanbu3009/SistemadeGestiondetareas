import type { Propiedad, PropiedadFormData } from '../types';

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

// Get all properties (paginated)
export const getPropiedades = async (
  page: number = 0,
  size: number = 10,
  search?: string
): Promise<{ content: Propiedad[]; totalElements: number; totalPages: number }> => {
  const params = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
  });

  if (search) {
    params.append('search', search);
  }

  const response = await fetch(`${API_URL}/propiedades?${params}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  return handleResponse(response);
};

// Get all properties (no pagination)
export const getAllPropiedades = async (): Promise<Propiedad[]> => {
  const response = await fetch(`${API_URL}/propiedades/all`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  return handleResponse(response);
};

// Get a single property by ID
export const getPropiedadById = async (id: number): Promise<Propiedad> => {
  const response = await fetch(`${API_URL}/propiedades/${id}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  return handleResponse(response);
};

// Create a new property
export const createPropiedad = async (data: PropiedadFormData): Promise<Propiedad> => {
  const response = await fetch(`${API_URL}/propiedades`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  return handleResponse(response);
};

// Update an existing property
export const updatePropiedad = async (id: number, data: PropiedadFormData): Promise<Propiedad> => {
  const response = await fetch(`${API_URL}/propiedades/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  return handleResponse(response);
};

// Delete a property
export const deletePropiedad = async (id: number): Promise<void> => {
  const response = await fetch(`${API_URL}/propiedades/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Error al eliminar' }));
    throw new Error(error.message || `Error: ${response.status}`);
  }
};

// Get available properties
export const getPropiedadesDisponibles = async (): Promise<Propiedad[]> => {
  const response = await fetch(`${API_URL}/propiedades/disponibles`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  return handleResponse(response);
};
