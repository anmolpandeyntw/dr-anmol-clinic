import { useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { getMockAvailableSlots } from '../lib/mockData';
import type { AvailableSlots, Schedule, BlockedDate } from '../types/database';

export function useAvailableSlots() {
  const [slots, setSlots] = useState<AvailableSlots | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSlots = useCallback(async (clinicId: string, date: string) => {
    setLoading(true);
    setError(null);

    // Check local blocked dates first
    const savedBlocked = localStorage.getItem('saved_blocked_dates');
    if (savedBlocked) {
      try {
        const parsed: BlockedDate[] = JSON.parse(savedBlocked);
        const isBlockedLocally = parsed.some(b => b.date === date && (b.clinic_id === clinicId || b.clinic_id === 'ALL'));
        if (isBlockedLocally) {
          setSlots({
            available: false,
            reason: 'blocked',
            max_tokens: 0,
            booked_count: 0,
            available_count: 0,
            start_time: '00:00:00',
            end_time: '00:00:00'
          });
          setLoading(false);
          return;
        }
      } catch {}
    }

    if (!isSupabaseConfigured) {
      setSlots(getMockAvailableSlots(clinicId));
      setLoading(false);
      return;
    }

    try {
      const { data, error: err } = await supabase.rpc('get_available_slots', {
        p_clinic_id: clinicId,
        p_date: date,
      });

      if (err || !data) {
        setSlots(getMockAvailableSlots(clinicId));
      } else {
        setSlots(data as AvailableSlots);
      }
    } catch {
      setSlots(getMockAvailableSlots(clinicId));
    } finally {
      setLoading(false);
    }
  }, []);

  return { slots, loading, error, fetchSlots };
}

export function useScheduleData(clinicId: string | null) {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchScheduleData = useCallback(async () => {
    if (!clinicId) return;
    setLoading(true);

    let localBlocked: BlockedDate[] = [];
    const savedBlocked = localStorage.getItem('saved_blocked_dates');
    if (savedBlocked) {
      try {
        const parsed: BlockedDate[] = JSON.parse(savedBlocked);
        localBlocked = parsed.filter(b => b.clinic_id === clinicId || b.clinic_id === 'ALL');
      } catch {}
    }

    if (!isSupabaseConfigured) {
      setSchedules([
        { id: '1', clinic_id: clinicId, day_of_week: 1, start_time: '10:00:00', end_time: '14:00:00', max_tokens: 20, is_active: true, created_at: '', updated_at: '' },
        { id: '2', clinic_id: clinicId, day_of_week: 2, start_time: '17:00:00', end_time: '20:00:00', max_tokens: 15, is_active: true, created_at: '', updated_at: '' },
        { id: '3', clinic_id: clinicId, day_of_week: 3, start_time: '10:00:00', end_time: '14:00:00', max_tokens: 20, is_active: true, created_at: '', updated_at: '' },
        { id: '4', clinic_id: clinicId, day_of_week: 4, start_time: '17:00:00', end_time: '20:00:00', max_tokens: 15, is_active: true, created_at: '', updated_at: '' },
        { id: '5', clinic_id: clinicId, day_of_week: 5, start_time: '10:00:00', end_time: '14:00:00', max_tokens: 20, is_active: true, created_at: '', updated_at: '' },
        { id: '6', clinic_id: clinicId, day_of_week: 6, start_time: '10:00:00', end_time: '14:00:00', max_tokens: 20, is_active: true, created_at: '', updated_at: '' },
      ]);
      setBlockedDates(localBlocked);
      setLoading(false);
      return;
    }

    try {
      const [schedulesRes, blockedRes] = await Promise.all([
        supabase
          .from('schedules')
          .select('clinic_id, day_of_week, start_time, end_time, max_tokens')
          .eq('clinic_id', clinicId),
        supabase
          .from('blocked_dates')
          .select('*')
          .or(`clinic_id.eq.${clinicId},clinic_id.eq.ALL`),
      ]);

      if (schedulesRes.error || !schedulesRes.data || schedulesRes.data.length === 0) {
        setSchedules([
          { id: '1', clinic_id: clinicId, day_of_week: 1, start_time: '10:00:00', end_time: '14:00:00', max_tokens: 20, is_active: true, created_at: '', updated_at: '' },
          { id: '2', clinic_id: clinicId, day_of_week: 2, start_time: '17:00:00', end_time: '20:00:00', max_tokens: 15, is_active: true, created_at: '', updated_at: '' },
          { id: '3', clinic_id: clinicId, day_of_week: 3, start_time: '10:00:00', end_time: '14:00:00', max_tokens: 20, is_active: true, created_at: '', updated_at: '' },
          { id: '4', clinic_id: clinicId, day_of_week: 4, start_time: '17:00:00', end_time: '20:00:00', max_tokens: 15, is_active: true, created_at: '', updated_at: '' },
          { id: '5', clinic_id: clinicId, day_of_week: 5, start_time: '10:00:00', end_time: '14:00:00', max_tokens: 20, is_active: true, created_at: '', updated_at: '' },
          { id: '6', clinic_id: clinicId, day_of_week: 6, start_time: '10:00:00', end_time: '14:00:00', max_tokens: 20, is_active: true, created_at: '', updated_at: '' },
        ]);
      } else {
        setSchedules(schedulesRes.data as Schedule[]);
      }

      if (blockedRes.data && blockedRes.data.length > 0) {
        // Merge with localBlocked to ensure any newly added offline blocked date is included
        const combined = [...blockedRes.data, ...localBlocked];
        const unique = Array.from(new Map(combined.map(item => [item.date + item.clinic_id, item])).values());
        setBlockedDates(unique as BlockedDate[]);
      } else {
        setBlockedDates(localBlocked);
      }
    } catch {
      setBlockedDates(localBlocked);
    } finally {
      setLoading(false);
    }
  }, [clinicId]);

  return { schedules, blockedDates, loading, fetchScheduleData };
}
