import { useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { MOCK_SPECIALIZATIONS } from '../lib/mockData';
import type { Specialization } from '../types/database';

const SPEC_COLUMNS = 'id, name, description, display_order';

export function useSpecializations() {
  const [specializations, setSpecializations] = useState<Specialization[]>(MOCK_SPECIALIZATIONS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchSpecializations() {
      if (!isSupabaseConfigured) {
        setSpecializations(MOCK_SPECIALIZATIONS);
        setLoading(false);
        return;
      }

      try {
        const { data, error: err } = await supabase
          .from('specializations')
          .select(SPEC_COLUMNS)
          .order('display_order');

        if (err || !data || data.length === 0) {
          if (!cancelled) {
            setSpecializations(MOCK_SPECIALIZATIONS);
            if (err) setError(err.message);
          }
        } else if (!cancelled) {
          setSpecializations(data as Specialization[]);
        }
      } catch (e) {
        if (!cancelled) {
          setSpecializations(MOCK_SPECIALIZATIONS);
          setError(e instanceof Error ? e.message : 'Error');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchSpecializations();
    return () => { cancelled = true; };
  }, []);

  return { specializations, loading, error };
}
