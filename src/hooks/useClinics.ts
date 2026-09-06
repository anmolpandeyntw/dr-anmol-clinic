import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { MOCK_CLINICS } from '../lib/mockData';
import type { Clinic } from '../types/database';

export function useClinics() {
  const [clinics, setClinics] = useState<Clinic[]>(() => {
    const saved = localStorage.getItem('saved_clinics_list');
    if (saved) {
      try { return JSON.parse(saved); } catch { return MOCK_CLINICS; }
    }
    return MOCK_CLINICS;
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchClinics = useCallback(async () => {
    const saved = localStorage.getItem('saved_clinics_list');
    let localSaved: Clinic[] | null = null;
    if (saved) {
      try { localSaved = JSON.parse(saved); } catch { localSaved = null; }
    }

    if (!isSupabaseConfigured) {
      setClinics(localSaved || MOCK_CLINICS);
      setLoading(false);
      return;
    }

    try {
      const { data, error: err } = await supabase
        .from('clinics')
        .select('*')
        .order('display_order', { ascending: true });

      if (err || !data || data.length === 0) {
        setClinics(localSaved || MOCK_CLINICS);
        if (err) setError(err.message);
      } else {
        const dbClinics = data as Clinic[];
        if (localSaved && localSaved.length > 0) {
          // Merge local edits and include new clinics added locally
          const dbIds = new Set(dbClinics.map(c => c.id));
          const dbNames = new Set(dbClinics.map(c => c.name.toLowerCase()));

          const mergedDb = dbClinics.map(dbc => {
            const match = localSaved!.find(lc => lc.id === dbc.id || lc.name.toLowerCase() === dbc.name.toLowerCase());
            return match ? { ...dbc, ...match } : dbc;
          });

          const newLocalOnly = localSaved.filter(lc => !dbIds.has(lc.id) && !dbNames.has(lc.name.toLowerCase()));

          setClinics([...mergedDb, ...newLocalOnly]);
        } else {
          setClinics(dbClinics);
        }
      }
    } catch (e) {
      setClinics(localSaved || MOCK_CLINICS);
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClinics();

    const handleUpdate = () => fetchClinics();
    window.addEventListener('clinics_updated', handleUpdate);
    return () => window.removeEventListener('clinics_updated', handleUpdate);
  }, [fetchClinics]);

  return { clinics, loading, error, refetch: fetchClinics };
}
