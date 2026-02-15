// Universe React Hooks
// Data fetching and mutations for universes

import { useState, useEffect } from 'react';
import {
  listUniverses,
  getUniverse,
  createUniverse,
  updateUniverse,
  deleteUniverse,
  Universe,
  CreateUniverseInput,
  UpdateUniverseInput,
} from '@/lib/api';

export function useUniverses() {
  const [universes, setUniverses] = useState<Universe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadUniverses();
  }, []);

  async function loadUniverses() {
    try {
      setLoading(true);
      setError(null);
      const data = await listUniverses();
      setUniverses(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load universes');
    } finally {
      setLoading(false);
    }
  }

  async function create(input: CreateUniverseInput): Promise<Universe> {
    const universe = await createUniverse(input);
    setUniverses((prev) => [universe, ...prev]);
    return universe;
  }

  async function update(id: string, input: UpdateUniverseInput): Promise<Universe> {
    const updated = await updateUniverse(id, input);
    setUniverses((prev) => prev.map((u) => (u.id === id ? updated : u)));
    return updated;
  }

  async function remove(id: string): Promise<void> {
    await deleteUniverse(id);
    setUniverses((prev) => prev.filter((u) => u.id !== id));
  }

  return {
    universes,
    loading,
    error,
    refresh: loadUniverses,
    create,
    update,
    remove,
  };
}

export function useUniverse(id: string | undefined) {
  const [universe, setUniverse] = useState<Universe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setUniverse(null);
      setLoading(false);
      return;
    }

    loadUniverse();
  }, [id]);

  async function loadUniverse() {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      const data = await getUniverse(id);
      setUniverse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load universe');
    } finally {
      setLoading(false);
    }
  }

  async function update(input: UpdateUniverseInput): Promise<Universe | null> {
    if (!id) return null;

    const updated = await updateUniverse(id, input);
    setUniverse(updated);
    return updated;
  }

  return {
    universe,
    loading,
    error,
    refresh: loadUniverse,
    update,
  };
}
