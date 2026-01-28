import type { Pago } from '../types';

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

// Interface for paginated response
interface PaginatedPagos {
  content: Pago[];
  totalElements: number;
  totalPages: number;
}

// Interface for stats response
interface PagosStats {
  ingresosMes: number;
  rentasPendientes: number;
}

// Interface for creating a new pago
interface CreatePagoData {
  inquilinoId: number;
  propiedadId: number;
  monto: number;
  fechaVencimiento: string;
  fechaPago?: string;
  comprobante?: string;
}

// Interface for registering a payment
interface RegistrarPagoData {
  fechaPago: string;
  comprobante?: string;
}

// Get all pagos (paginated)
export const getPagos = async (
  page: number = 0,
  size: number = 10,
  search?: string,
  estado?: string
): Promise<PaginatedPagos> => {
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

  const response = await fetch(`${API_URL}/pagos?${params}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  return handleResponse(response);
};

// Get all pagos (no pagination)
export const getAllPagos = async (): Promise<Pago[]> => {
  const response = await fetch(`${API_URL}/pagos/all`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  return handleResponse(response);
};

// Get a single pago by ID
export const getPagoById = async (id: number): Promise<Pago> => {
  const response = await fetch(`${API_URL}/pagos/${id}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  return handleResponse(response);
};

// Get pagos by estado
export const getPagosByEstado = async (estado: string): Promise<Pago[]> => {
  const response = await fetch(`${API_URL}/pagos/estado/${estado}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  return handleResponse(response);
};

// Get atrasados (late payments)
export const getPagosAtrasados = async (): Promise<Pago[]> => {
  const response = await fetch(`${API_URL}/pagos/atrasados`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  return handleResponse(response);
};

// Create a new pago
export const createPago = async (data: CreatePagoData): Promise<Pago> => {
  const response = await fetch(`${API_URL}/pagos`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  return handleResponse(response);
};

// Update an existing pago
export const updatePago = async (id: number, data: CreatePagoData): Promise<Pago> => {
  const response = await fetch(`${API_URL}/pagos/${id}`, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  return handleResponse(response);
};

// Register a payment (mark as paid)
export const registrarPago = async (id: number, data: RegistrarPagoData): Promise<Pago> => {
  const response = await fetch(`${API_URL}/pagos/${id}/registrar`, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
  });

  return handleResponse(response);
};

// Delete a pago
export const deletePago = async (id: number): Promise<void> => {
  const response = await fetch(`${API_URL}/pagos/${id}`, {
    method: 'DELETE',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Error al eliminar' }));
    throw new Error(error.message || `Error: ${response.status}`);
  }
};

// Get total count
export const getPagosCount = async (): Promise<number> => {
  const response = await fetch(`${API_URL}/pagos/stats/count`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  return handleResponse(response);
};

// Get count by estado
export const getPagosCountByEstado = async (estado: string): Promise<number> => {
  const response = await fetch(`${API_URL}/pagos/stats/count/${estado}`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  return handleResponse(response);
};

// Get morosos count
export const getMorososCount = async (): Promise<number> => {
  const response = await fetch(`${API_URL}/pagos/stats/morosos`, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  return handleResponse(response);
};

// Get monthly income stats
export const getIngresosMes = async (month?: number, year?: number): Promise<PagosStats> => {
  const params = new URLSearchParams();

  if (month !== undefined) {
    params.append('month', month.toString());
  }

  if (year !== undefined) {
    params.append('year', year.toString());
  }

  const queryString = params.toString();
  const url = queryString ? `${API_URL}/pagos/stats/ingresos-mes?${queryString}` : `${API_URL}/pagos/stats/ingresos-mes`;

  const response = await fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
  });

  return handleResponse(response);
};
