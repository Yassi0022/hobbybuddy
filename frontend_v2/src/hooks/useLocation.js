import { useState, useCallback } from 'react';

const CITY_STORAGE_KEY = 'hb_user_city';
const GEO_STORAGE_KEY = 'hb_geo_tried';
const LAT_STORAGE_KEY = 'hb_lat';
const LNG_STORAGE_KEY = 'hb_lng';

/**
 * Shared location hook for Discover and Events pages.
 *
 * Location resolution chain:
 *   1. Explicitly set city (manual input, persisted to localStorage)
 *   2. Browser geolocation (one-time consent, persisted coords)
 *   3. null (triggers "set your city" fallback in UI)
 *
 * Provides geolocation consent flow: requests permission once per session,
 * stores result, and lets the user override with manual city input anytime.
 */
export default function useLocation() {
  const [city, setCity] = useState(() => localStorage.getItem(CITY_STORAGE_KEY) || '');
  const [lat, setLat] = useState(() => localStorage.getItem(LAT_STORAGE_KEY) || null);
  const [lng, setLng] = useState(() => localStorage.getItem(LNG_STORAGE_KEY) || null);
  const [geoStatus, setGeoStatus] = useState(() => {
    if (localStorage.getItem(GEO_STORAGE_KEY)) return 'done';
    return 'idle'; // 'idle' | 'requesting' | 'done' | 'denied'
  });

  // Try geolocation once per session (non-blocking)
  const requestGeolocation = useCallback(() => {
    if (localStorage.getItem(GEO_STORAGE_KEY)) return;
    if (!navigator.geolocation) {
      localStorage.setItem(GEO_STORAGE_KEY, '1');
      setGeoStatus('denied');
      return;
    }
    setGeoStatus('requesting');
    localStorage.setItem(GEO_STORAGE_KEY, '1');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const la = pos.coords.latitude;
        const ln = pos.coords.longitude;
        localStorage.setItem(LAT_STORAGE_KEY, la);
        localStorage.setItem(LNG_STORAGE_KEY, ln);
        setLat(String(la));
        setLng(String(ln));
        setGeoStatus('done');
      },
      () => {
        setGeoStatus('denied');
      },
      { timeout: 8000, enableHighAccuracy: false }
    );
  }, []);

  // Manual city override
  const setManualCity = useCallback((newCity) => {
    const trimmed = newCity.trim();
    setCity(trimmed);
    if (trimmed) {
      localStorage.setItem(CITY_STORAGE_KEY, trimmed);
    } else {
      localStorage.removeItem(CITY_STORAGE_KEY);
    }
  }, []);

  // Build query params for API calls
  const buildParams = useCallback((extra = {}) => {
    const params = new URLSearchParams();
    if (city) params.set('city', city);
    if (lat) params.set('lat', lat);
    if (lng) params.set('lng', lng);
    Object.entries(extra).forEach(([k, v]) => {
      if (v !== null && v !== undefined && v !== '') params.set(k, v);
    });
    return params.toString();
  }, [city, lat, lng]);

  return {
    city,
    lat,
    lng,
    geoStatus,
    setManualCity,
    requestGeolocation,
    buildParams,
    hasLocation: !!(city || (lat && lng)),
  };
}
