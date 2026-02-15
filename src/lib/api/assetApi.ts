// Asset API Client
// Frontend API calls for reusable assets

export type AssetType = 'character' | 'illustration' | 'cover' | 'background' | 'prop' | 'other';

export interface CreateAssetInput {
  universeId?: string;
  type: AssetType;
  name: string;
  description?: string;
  data: Record<string, any>;
  thumbnailUrl?: string;
  fileUrls?: string[];
  metadata?: Record<string, any>;
  tags?: string[];
}

export interface UpdateAssetInput {
  universeId?: string;
  name?: string;
  description?: string;
  data?: Record<string, any>;
  thumbnailUrl?: string;
  fileUrls?: string[];
  metadata?: Record<string, any>;
  tags?: string[];
}

export interface Asset {
  id: string;
  accountId: string;
  universeId?: string | null;
  type: AssetType;
  name: string;
  description?: string | null;
  data: Record<string, any>;
  thumbnailUrl?: string | null;
  fileUrls: string[];
  metadata: Record<string, any>;
  tags: string[];
  usageCount: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}

const API_BASE = import.meta.env.VITE_AI_IMAGE_PROXY_URL?.replace('/ai/image', '') || '/api';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
    throw new Error(error.error?.message || 'API request failed');
  }
  return response.json();
}

export async function listAssets(filters?: { universeId?: string; type?: AssetType }): Promise<Asset[]> {
  const params = new URLSearchParams();
  if (filters?.universeId) params.set('universe_id', filters.universeId);
  if (filters?.type) params.set('type', filters.type);

  const response = await fetch(`${API_BASE}/assets?${params}`, {
    credentials: 'include',
  });
  const data = await handleResponse<{ assets: Asset[] }>(response);
  return data.assets;
}

export async function getAsset(id: string): Promise<Asset> {
  const response = await fetch(`${API_BASE}/assets/${id}`, {
    credentials: 'include',
  });
  const data = await handleResponse<{ asset: Asset }>(response);
  return data.asset;
}

export async function createAsset(input: CreateAssetInput): Promise<Asset> {
  const response = await fetch(`${API_BASE}/assets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(input),
  });
  const data = await handleResponse<{ asset: Asset }>(response);
  return data.asset;
}

export async function updateAsset(id: string, input: UpdateAssetInput): Promise<Asset> {
  const response = await fetch(`${API_BASE}/assets/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(input),
  });
  const data = await handleResponse<{ asset: Asset }>(response);
  return data.asset;
}

export async function deleteAsset(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/assets/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
    throw new Error(error.error?.message || 'Failed to delete asset');
  }
}

export async function migrateCharacter(characterId: string, universeId?: string): Promise<Asset> {
  const response = await fetch(`${API_BASE}/assets/migrate-character`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ characterId, universeId }),
  });
  const data = await handleResponse<{ asset: Asset }>(response);
  return data.asset;
}
