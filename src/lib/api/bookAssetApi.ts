// Book-Asset API Client
// Frontend API calls for book-asset relationships

export type BookAssetRole = 'character' | 'illustration' | 'cover' | 'background' | 'other';

export interface CreateBookAssetInput {
  bookId: string;
  assetId: string;
  role: BookAssetRole;
  usageContext?: Record<string, any>;
  orderIndex?: number;
}

export interface UpdateBookAssetInput {
  role?: BookAssetRole;
  usageContext?: Record<string, any>;
  orderIndex?: number;
}

export interface BookAsset {
  id: string;
  bookId: string;
  assetId: string;
  role: BookAssetRole;
  usageContext: Record<string, any>;
  orderIndex: number;
  createdAt: string;
}

const API_BASE = import.meta.env.VITE_AI_IMAGE_PROXY_URL?.replace('/ai/image', '') || '/api';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
    throw new Error(error.error?.message || 'API request failed');
  }
  return response.json();
}

export async function listBookAssets(filters: {
  bookId?: string;
  assetId?: string;
  role?: BookAssetRole;
}): Promise<BookAsset[]> {
  const params = new URLSearchParams();
  if (filters.bookId) params.set('book_id', filters.bookId);
  if (filters.assetId) params.set('asset_id', filters.assetId);
  if (filters.role) params.set('role', filters.role);

  const response = await fetch(`${API_BASE}/book-assets?${params}`, {
    credentials: 'include',
  });
  const data = await handleResponse<{ bookAssets: BookAsset[] }>(response);
  return data.bookAssets;
}

export async function createBookAsset(input: CreateBookAssetInput): Promise<BookAsset> {
  const response = await fetch(`${API_BASE}/book-assets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(input),
  });
  const data = await handleResponse<{ bookAsset: BookAsset }>(response);
  return data.bookAsset;
}

export async function updateBookAsset(id: string, input: UpdateBookAssetInput): Promise<BookAsset> {
  const response = await fetch(`${API_BASE}/book-assets/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(input),
  });
  const data = await handleResponse<{ bookAsset: BookAsset }>(response);
  return data.bookAsset;
}

export async function deleteBookAsset(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/book-assets/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
    throw new Error(error.error?.message || 'Failed to remove book-asset link');
  }
}
