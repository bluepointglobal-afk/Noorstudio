// Document Model
// Maps to documents table in database

export type DocumentType = 'book' | 'series_bible' | 'note' | 'outline' | 'other';

export interface Document {
  id: string;
  account_id: string;
  universe_id?: string | null;
  type: DocumentType;
  title: string;
  content: Record<string, any>;
  metadata: Record<string, any>;
  tags: string[];
  version: number;
  parent_id?: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date | null;
}

export interface CreateDocumentInput {
  account_id: string;
  universe_id?: string | null;
  type: DocumentType;
  title: string;
  content: Record<string, any>;
  metadata?: Record<string, any>;
  tags?: string[];
  parent_id?: string | null;
}

export interface UpdateDocumentInput {
  title?: string;
  content?: Record<string, any>;
  metadata?: Record<string, any>;
  tags?: string[];
  universe_id?: string | null;
}

export interface DocumentFilters {
  account_id: string;
  universe_id?: string;
  type?: DocumentType;
  tags?: string[];
  include_deleted?: boolean;
}

// Helper functions for document operations
export const DocumentHelpers = {
  /**
   * Check if document is active (not soft-deleted)
   */
  isActive(document: Document): boolean {
    return document.deleted_at === null || document.deleted_at === undefined;
  },

  /**
   * Get word count from document content
   */
  getWordCount(document: Document): number {
    if (document.type === 'book' && document.content.chapters) {
      return document.content.chapters.reduce((total: number, chapter: any) => {
        return total + (chapter.wordCount || 0);
      }, 0);
    }
    return 0;
  },

  /**
   * Format document for API response
   */
  toApiResponse(document: Document) {
    return {
      id: document.id,
      accountId: document.account_id,
      universeId: document.universe_id,
      type: document.type,
      title: document.title,
      content: document.content,
      metadata: document.metadata,
      tags: document.tags,
      version: document.version,
      parentId: document.parent_id,
      createdAt: document.created_at.toISOString(),
      updatedAt: document.updated_at.toISOString(),
      deletedAt: document.deleted_at?.toISOString() || null,
    };
  },
};
