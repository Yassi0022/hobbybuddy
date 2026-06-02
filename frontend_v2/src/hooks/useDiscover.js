import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../utils/constants';

/**
 * Discover data hook — fetches people, event teasers, and suggestions.
 *
 * Handles loading, error, and fallback states.
 * Re-fetches when city or auth token changes.
 */
export default function useDiscover(city, buildParams) {
  const { authFetch } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDiscover = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = buildParams({ limit: 10 });
      const res = await authFetch(`${API_BASE_URL}/api/discover?${params}`);
      if (!res.ok) {
        throw new Error('Failed to load discover');
      }
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err.message);
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [authFetch, buildParams]);

  useEffect(() => {
    fetchDiscover();
  }, [fetchDiscover]);

  return {
    people: data?.people || [],
    eventTeasers: data?.eventTeasers || [],
    suggestions: data?.suggestions || null,
    location: data?.location || null,
    fallback: data?.fallback || null,
    loading,
    error,
    refetch: fetchDiscover,
  };
}
