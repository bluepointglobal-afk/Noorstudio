// Document API Client
// Frontend API calls for document library

export type DocumentType = 'book' | 'series_bible' | 'note' | 'outline' | 'other';

export interface CreateDocumentInput {
  universeId?: string;
  type: DocumentType;
  title: string;
  content: Record<string, any>;
  metadata?: Record<string, any>;
  tags?: string[];
  parentId?: string;
}

export interface UpdateDocumentInput {
  universeId?: string;
  title?: string;
  content?: Record<string, any>;
  metadata?: Record<string, any>;
  tags?: string[];
}

export interface Document {
  id: string;
  accountId: string;
  universeId?: string | null;
  type: DocumentType;
  title: string;
  content: Record<string, any>;
  metadata: Record<string, any>;
  tags: string[];
  version: number;
  parentId?: string | null;
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

export async function listDocuments(filters?: {
  universeId?: string;
  type?: DocumentType;
  tags?: string[];
}): Promise<Document[]> {
  const params = new URLSearchParams();
  if (filters?.universeId) params.set('universe_id', filters.universeId);
  if (filters?.type) params.set('type', filters.type);
  if (filters?.tags?.length) params.set('tags', filters.tags.join(','));

  const response = await fetch(`${API_BASE}/documents?${params}`, {
    credentials: 'include',
  });
  const data = await handleResponse<{ documents: Document[] }>(response);
  return data.documents;
}

export async function getDocument(id: string): Promise<Document> {
  const response = await fetch(`${API_BASE}/documents/${id}`, {
    credentials: 'include',
  });
  const data = await handleResponse<{ document: Document }>(response);
  return data.document;
}

export async function createDocument(input: CreateDocumentInput): Promise<Document> {
  const response = await fetch(`${API_BASE}/documents`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(input),
  });
  const data = await handleResponse<{ document: Document }>(response);
  return data.document;
}

export async function updateDocument(id: string, input: UpdateDocumentInput): Promise<Document> {
  const response = await fetch(`${API_BASE}/documents/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(input),
  });
  const data = await handleResponse<{ document: Document }>(response);
  return data.document;
}

export async function deleteDocument(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/documents/${id}`, {
    method: 'DELETE',
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: { message: response.statusText } }));
    throw new Error(error.error?.message || 'Failed to delete document');
  }
}
