const getBaseUrl = () => {
  let url = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  
  // Remove any trailing slash
  url = url.replace(/\/$/, '');
  
  // If it's a production host but lacks a protocol, add https://
  if (url.includes('onrender.com') && !url.startsWith('http')) {
    url = `https://${url}`;
  }
  
  return url;
};

const API_URL = getBaseUrl();

export interface ApiError {
  detail: string;
}

export interface User {
  id: number;
  email: string;
  full_name?: string;
  is_active: boolean;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface PackagingResult {
  id: number;
  order_id: number;
  recommended_box: string;
  confidence_score: number;
  efficiency_score: number;
  baseline_cost: number;
  optimized_cost: number;
  savings: number;
  decision_explanation: string;
  alternative_boxes: string;
  box_dimensions: string;
  prediction_source: string;
  created_at: string;
}

export interface Order {
  id: number;
  user_id: number;
  product_name: string;
  length: number;
  width: number;
  height: number;
  weight: number;
  quantity: number;
  status: string;
  created_at: string;
  packaging_result?: PackagingResult;
}

export interface Analytics {
  total_orders_today: number;
  total_savings_today: number;
  avg_savings_per_order: number;
  avg_efficiency_score: number;
  box_usage_distribution: Record<string, number>;
  orders_per_hour: Array<{ hour: string; count: number }>;
  savings_trend: Array<{ date: string; savings: number }>;
}

export interface AlternativeBox {
  box_type: string;
  dimensions: string;
  cost: number;
  efficiency: number;
}

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('access_token');
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  auth = true
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (auth) {
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const err: ApiError = await res.json();
      msg = err.detail || msg;
    } catch {}
    throw new Error(msg);
  }

  return res.json();
}

export const api = {
  auth: {
    register: (email: string, password: string, full_name?: string) =>
      request<TokenResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({ email, password, full_name }),
      }, false),

    login: (email: string, password: string) =>
      request<TokenResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      }, false),
  },

  orders: {
    list: () => request<Order[]>('/orders'),
    get: (id: number) => request<Order>(`/orders/${id}`),
    create: (data: {
      product_name: string;
      length: number;
      width: number;
      height: number;
      weight: number;
      quantity: number;
    }) => request<Order>('/orders', { method: 'POST', body: JSON.stringify(data) }),

    uploadCSV: async (file: File) => {
      const token = getToken();
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_URL}/orders/upload-csv`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Upload failed');
      }
      return res.json();
    },

    analytics: () => request<Analytics>('/orders/analytics'),
  },

  predict: (data: {
    order_id: number;
    length: number;
    width: number;
    height: number;
    weight: number;
  }) => request('/predict-packaging', { method: 'POST', body: JSON.stringify(data) }),

  health: () => request('/health', {}, false),
};
