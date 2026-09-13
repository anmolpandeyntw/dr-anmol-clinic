import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { MOCK_DOCTOR } from '../lib/mockData';
import type { Doctor } from '../types/database';

const DOCTOR_COLUMNS =
  'id, full_name, title, subtitle, bio, years_of_experience, photo_url, qualifications, experience, memberships, publications';

export function useDoctor() {
  const [doctor, setDoctor] = useState<Doctor>(() => {
    const saved = localStorage.getItem('saved_doctor_profile');
    const baseDoc = { ...MOCK_DOCTOR, full_name: 'Dr. Anmol Pandey', photo_url: '/images/doctor_portrait.jpg' };
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...baseDoc, ...parsed };
      } catch {
        return baseDoc;
      }
    }
    return baseDoc;
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDoctor = useCallback(async () => {
    const saved = localStorage.getItem('saved_doctor_profile');
    let localOverride: Partial<Doctor> | null = null;
    if (saved) {
      try {
        localOverride = JSON.parse(saved);
      } catch {
        localOverride = null;
      }
    }

    const defaultBase = { ...MOCK_DOCTOR, full_name: 'Dr. Anmol Pandey' };

    if (!isSupabaseConfigured) {
      setDoctor({ ...defaultBase, ...localOverride });
      setLoading(false);
      return;
    }

    try {
      const { data, error: err } = await supabase
        .from('doctors')
        .select(DOCTOR_COLUMNS)
        .limit(1);

      if (err || !data || data.length === 0) {
        setDoctor({ ...defaultBase, ...localOverride });
        if (err) setError(err.message);
      } else {
        const docFromDb = data[0] as Doctor;
        setDoctor({
          ...defaultBase,
          ...docFromDb,
          qualifications: (docFromDb.qualifications && docFromDb.qualifications.length > 0) ? docFromDb.qualifications : (localOverride?.qualifications || defaultBase.qualifications),
          experience: (docFromDb.experience && docFromDb.experience.length > 0) ? docFromDb.experience : (localOverride?.experience || defaultBase.experience),
          memberships: (docFromDb.memberships && docFromDb.memberships.length > 0) ? docFromDb.memberships : (localOverride?.memberships || defaultBase.memberships),
          publications: (docFromDb.publications && docFromDb.publications.length > 0) ? docFromDb.publications : (localOverride?.publications || defaultBase.publications),
        });
      }
    } catch (e) {
      setDoctor({ ...defaultBase, ...localOverride });
      setError(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDoctor();

    const handleUpdate = () => {
      fetchDoctor();
    };

    window.addEventListener('doctor_profile_updated', handleUpdate);
    return () => window.removeEventListener('doctor_profile_updated', handleUpdate);
  }, [fetchDoctor]);

  return { doctor, loading, error, refetch: fetchDoctor };
}
