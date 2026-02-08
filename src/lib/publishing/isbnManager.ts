/**
 * ISBN Manager
 * Manage and validate ISBNs for different book formats
 */

import { ISBNRecord, ISBNManager } from "./types";

// ============================================
// ISBN Validation
// ============================================

/**
 * Validate ISBN-13 checksum
 */
export function validateISBN13(isbn: string): boolean {
  // Remove hyphens and spaces
  const cleaned = isbn.replace(/[-\s]/g, "");
  
  if (cleaned.length !== 13 || !/^\d{13}$/.test(cleaned)) {
    return false;
  }
  
  // Calculate checksum
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(cleaned[i]);
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit === parseInt(cleaned[12]);
}

/**
 * Validate ISBN-10 checksum
 */
export function validateISBN10(isbn: string): boolean {
  const cleaned = isbn.replace(/[-\s]/g, "");
  
  if (cleaned.length !== 10 || !/^\d{9}[\dX]$/i.test(cleaned)) {
    return false;
  }
  
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleaned[i]) * (10 - i);
  }
  
  const lastChar = cleaned[9].toUpperCase();
  const checkValue = lastChar === 'X' ? 10 : parseInt(lastChar);
  sum += checkValue;
  
  return sum % 11 === 0;
}

/**
 * Convert ISBN-10 to ISBN-13
 */
export function isbn10ToISBN13(isbn10: string): string | null {
  const cleaned = isbn10.replace(/[-\s]/g, "");
  
  if (!validateISBN10(cleaned)) {
    return null;
  }
  
  const base = "978" + cleaned.substring(0, 9);
  
  // Calculate check digit
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(base[i]);
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  
  const checkDigit = (10 - (sum % 10)) % 10;
  return base + checkDigit;
}

/**
 * Format ISBN with hyphens (simplified)
 */
export function formatISBN(isbn: string): string {
  const cleaned = isbn.replace(/[-\s]/g, "");
  
  if (cleaned.length === 13) {
    // ISBN-13: 978-0-123456-78-9
    return `${cleaned.substring(0, 3)}-${cleaned.substring(3, 4)}-${cleaned.substring(4, 10)}-${cleaned.substring(10, 12)}-${cleaned.substring(12)}`;
  } else if (cleaned.length === 10) {
    // ISBN-10: 0-123456-78-9
    return `${cleaned.substring(0, 1)}-${cleaned.substring(1, 7)}-${cleaned.substring(7, 9)}-${cleaned.substring(9)}`;
  }
  
  return isbn;
}

// ============================================
// ISBN Manager Implementation
// ============================================

export class ISBNManagerImpl implements ISBNManager {
  public records: ISBNRecord[] = [];
  
  constructor(initialRecords: ISBNRecord[] = []) {
    this.records = initialRecords;
  }
  
  /**
   * Get ISBN for a specific format and platform
   */
  getISBN(format: ISBNRecord["format"], platform?: string): ISBNRecord | null {
    return this.records.find(r => 
      r.format === format && (!platform || r.platform === platform)
    ) || null;
  }
  
  /**
   * Add new ISBN record
   */
  addISBN(record: ISBNRecord): void {
    if (!this.validateISBN(record.isbn13)) {
      throw new Error(`Invalid ISBN-13: ${record.isbn13}`);
    }
    
    // Check for duplicates
    const exists = this.records.find(r => r.isbn13 === record.isbn13);
    if (exists) {
      throw new Error(`ISBN already exists: ${record.isbn13}`);
    }
    
    this.records.push(record);
  }
  
  /**
   * Validate ISBN (supports both ISBN-10 and ISBN-13)
   */
  validateISBN(isbn: string): boolean {
    const cleaned = isbn.replace(/[-\s]/g, "");
    
    if (cleaned.length === 13) {
      return validateISBN13(cleaned);
    } else if (cleaned.length === 10) {
      return validateISBN10(cleaned);
    }
    
    return false;
  }
  
  /**
   * Remove ISBN record
   */
  removeISBN(isbn13: string): boolean {
    const index = this.records.findIndex(r => r.isbn13 === isbn13);
    if (index !== -1) {
      this.records.splice(index, 1);
      return true;
    }
    return false;
  }
  
  /**
   * Get all ISBNs for a project
   */
  getProjectISBNs(projectId: string): ISBNRecord[] {
    return this.records.filter(r => r.projectId === projectId);
  }
  
  /**
   * Update ISBN record
   */
  updateISBN(isbn13: string, updates: Partial<ISBNRecord>): boolean {
    const index = this.records.findIndex(r => r.isbn13 === isbn13);
    if (index !== -1) {
      this.records[index] = { ...this.records[index], ...updates };
      return true;
    }
    return false;
  }
  
  /**
   * Serialize to JSON for storage
   */
  toJSON(): string {
    return JSON.stringify(this.records, null, 2);
  }
  
  /**
   * Load from JSON
   */
  static fromJSON(json: string): ISBNManagerImpl {
    const records = JSON.parse(json) as ISBNRecord[];
    return new ISBNManagerImpl(records);
  }
}

// ============================================
// ISBN Storage (localStorage)
// ============================================

const ISBN_STORAGE_KEY = "noorstudio:isbns";

export function saveISBNs(manager: ISBNManagerImpl): void {
  try {
    localStorage.setItem(ISBN_STORAGE_KEY, manager.toJSON());
  } catch (error) {
    console.error("Failed to save ISBNs:", error);
  }
}

export function loadISBNs(): ISBNManagerImpl {
  try {
    const stored = localStorage.getItem(ISBN_STORAGE_KEY);
    if (stored) {
      return ISBNManagerImpl.fromJSON(stored);
    }
  } catch (error) {
    console.error("Failed to load ISBNs:", error);
  }
  return new ISBNManagerImpl();
}

// ============================================
// Exports
// ============================================

export {
  validateISBN13,
  validateISBN10,
  isbn10ToISBN13,
  formatISBN,
};
