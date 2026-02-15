// Asset React Hooks
// Data fetching and mutations for reusable assets

import { useState, useEffect } from 'react';
import {
  listAssets,
  getAsset,
  createAsset,
  updateAsset,
  deleteAsset,
  Asset,
  AssetType,
  CreateAssetInput,
  UpdateAssetInput,
} from '@/lib/api';

export function useAssets(filters?: { universeId?: string; type?: AssetType }) {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAssets();
  }, [filters?.universeId, filters?.type]);

  async function loadAssets() {
    try {
      setLoading(true);
      setError(null);
      const data = await listAssets(filters);
      setAssets(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load assets');
    } finally {
      setLoading(false);
    }
  }

  async function create(input: CreateAssetInput): Promise<Asset> {
    const asset = await createAsset(input);
    setAssets((prev) => [asset, ...prev]);
    return asset;
  }

  async function update(id: string, input: UpdateAssetInput): Promise<Asset> {
    const updated = await updateAsset(id, input);
    setAssets((prev) => prev.map((a) => (a.id === id ? updated : a)));
    return updated;
  }

  async function remove(id: string): Promise<void> {
    await deleteAsset(id);
    setAssets((prev) => prev.filter((a) => a.id !== id));
  }

  return {
    assets,
    loading,
    error,
    refresh: loadAssets,
    create,
    update,
    remove,
  };
}

export function useAsset(id: string | undefined) {
  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setAsset(null);
      setLoading(false);
      return;
    }

    loadAsset();
  }, [id]);

  async function loadAsset() {
    if (!id) return;

    try {
      setLoading(true);
      setError(null);
      const data = await getAsset(id);
      setAsset(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load asset');
    } finally {
      setLoading(false);
    }
  }

  async function update(input: UpdateAssetInput): Promise<Asset | null> {
    if (!id) return null;

    const updated = await updateAsset(id, input);
    setAsset(updated);
    return updated;
  }

  return {
    asset,
    loading,
    error,
    refresh: loadAsset,
    update,
  };
}
