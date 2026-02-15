// Universe API Client
// Frontend API calls for universes

/**
 * JSON value types for flexible universe data structures
 */
export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };
export type JsonObject = { [key: string]: JsonValue };

export interface CreateUniverseInput {
  name: string;
  description?: string;
  seriesBible?: string;
  writingDNA?: JsonObject;
  visualDNA?: JsonObject;
  defaultStyleId?: string;
  bookPresets?: JsonObject;
  tags?: string[];
}

export interface UpdateUniverseInput {
  name?: string;
  description?: string;
  seriesBible?: string;
  writingDNA?: JsonObject;
  visualDNA?: JsonObject;
  defaultStyleId?: string;
  bookPresets?: JsonObject;
  tags?: string[];
}

export interface Universe {
  id: string;
  accountId: string;
  name: string;
  description?: string | null;
  seriesBible?: string | null;
  writingDNA: JsonObject;
  visualDNA: JsonObject;
  defaultStyleId?: string | null;
  bookPresets: JsonObject;
  metadata: JsonObject;
  tags: string[];
  bookCount: number;
  characterCount: number;
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

export async function listUniverses(): Promise<Universe[]> {
  const response = await fetch(`${API_BASE}/universes`, {
    credentials: 'include',
  });
  const data = await handleResponse<{ universes: Universe[] }>(response);
  return data.universes;
}

export async function getUniverse(id: string): Promise<Universe> {
  const response = await fetch(`${API_BASE}/universes/${id}`, {
    credentials: 'include',
  });
  const data = await handleResponse<{ universe: Universe }>(response);
  return data.universe;
}

export async function createUniverse(input: CreateUniverseInput): Promise<Universe> {
  const response = await fetch(`${API_BASE}/universes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(input),
  });
  const data = await handleResponse<{ universe: Universe }>(response);
  return data.universe;
}

export async function updateUniverse(id: string, input: UpdateUniverseInput): Promise<Universe> {
  const response = await fetch(`${API_BASE}/universes/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(input),
  });
  const data = await handleResponse<{ universe: Universe }>(response);
  return data.universe;
}

export async function deleteUniverse(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/universes/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
    throw new Error(error.error?.message || 'Failed to delete universe');
  }
}
