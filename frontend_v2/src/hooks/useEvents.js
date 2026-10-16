import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../utils/constants';
import { DEMO_EVENTS } from '../utils/demoData';

/**
 * Events data hook — fetches paginated event listing with filters.
 *
 * Supports: city, hobby, source (internal/external/all), pagination.
 */
export default function useEvents(city, buildParams, initialFilters = {}) {
  const { authFetch } = useAuth();
  const [events, setEvents] = useState([]);
  const [pagination, setPagination] = useState({ page: 0, size: 12, totalElements: 0, totalPages: 0 });
  const [filters, setFilters] = useState({ source: 'all', hobby: '', ...initialFilters });
  const [fallback, setFallback] = useState(null);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEvents = useCallback(async (page = 0) => {
    setLoading(true);
    setError(null);
    try {
      const params = buildParams({
        source: filters.source,
        hobby: filters.hobby || '',
        page,
        size: pagination.size,
      });
      const res = await authFetch(`${API_BASE_URL}/api/events?${params}`);
      if (!res.ok) {
        throw new Error('Failed to load events');
      }
      const json = await res.json();
      if (json.events && json.events.length > 0) {
        setEvents(json.events);
      } else {
        setEvents(DEMO_EVENTS);
      }
      setPagination(json.pagination || { page: 0, size: 12, totalElements: DEMO_EVENTS.length, totalPages: 1 });
      setFallback(json.fallback || null);
      setLocation(json.location || null);
    } catch (err) {
      setEvents(DEMO_EVENTS);
      setPagination({ page: 0, size: 12, totalElements: DEMO_EVENTS.length, totalPages: 1 });
    } finally {
      setLoading(false);
    }
  }, [authFetch, buildParams, filters, pagination.size]);

  useEffect(() => {
    const timer = setTimeout(() => fetchEvents(0), 0);
    return () => clearTimeout(timer);
  }, [fetchEvents]);

  const setFilter = useCallback((key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const goToPage = useCallback((page) => {
    fetchEvents(page);
  }, [fetchEvents]);

  return {
    events,
    pagination,
    filters,
    fallback,
    location,
    loading,
    error,
    setFilter,
    goToPage,
    refetch: fetchEvents,
  };
}
