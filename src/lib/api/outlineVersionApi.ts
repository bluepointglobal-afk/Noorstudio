// Outline Version API Client
// Frontend API calls for outline version control

export interface CreateOutlineVersionInput {
  bookId: string;
  data: Record<string, any>;
  lockedSections?: string[];
  changeSummary?: string;
  isCurrent?: boolean;
}

export interface OutlineVersion {
  id: string;
  bookId: string;
  versionNumber: number;
  data: Record<string, any>;
  lockedSections: string[];
  changeSummary?: string | null;
  isCurrent: boolean;
  createdBy?: string | null;
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

export async function listOutlineVersions(bookId: string, currentOnly = false): Promise<OutlineVersion[]> {
  const params = new URLSearchParams({ book_id: bookId });
  if (currentOnly) params.set('current_only', 'true');

  const response = await fetch(`${API_BASE}/outline-versions?${params}`, {
    credentials: 'include',
  });
  const data = await handleResponse<{ outlineVersions: OutlineVersion[] }>(response);
  return data.outlineVersions;
}

export async function getCurrentOutline(bookId: string): Promise<OutlineVersion> {
  const response = await fetch(`${API_BASE}/outline-versions/current/${bookId}`, {
    credentials: 'include',
  });
  const data = await handleResponse<{ outlineVersion: OutlineVersion }>(response);
  return data.outlineVersion;
}

export async function createOutlineVersion(input: CreateOutlineVersionInput): Promise<OutlineVersion> {
  const response = await fetch(`${API_BASE}/outline-versions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(input),
  });
  const data = await handleResponse<{ outlineVersion: OutlineVersion }>(response);
  return data.outlineVersion;
}

export async function setCurrentVersion(id: string): Promise<OutlineVersion> {
  const response = await fetch(`${API_BASE}/outline-versions/${id}/set-current`, {
    method: 'PATCH',
    credentials: 'include',
  });
  const data = await handleResponse<{ outlineVersion: OutlineVersion }>(response);
  return data.outlineVersion;
}

export async function updateLockedSections(id: string, lockedSections: string[]): Promise<OutlineVersion> {
  const response = await fetch(`${API_BASE}/outline-versions/${id}/lock-sections`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ lockedSections }),
  });
  const data = await handleResponse<{ outlineVersion: OutlineVersion }>(response);
  return data.outlineVersion;
}
