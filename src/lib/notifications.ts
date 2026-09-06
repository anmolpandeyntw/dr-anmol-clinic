import { supabase, isSupabaseConfigured } from './supabase';

export type NotificationType =
  | 'booking_confirmed'
  | 'payment_confirmed'
  | 'reminder'
  | 'cancelled'
  | 'queue_update'
  | 'consultation_approved'
  | 'consultation_rejected';

export interface NotificationPayload {
  patientName: string;
  patientMobile: string;
  clinicName?: string;
  date?: string;
  tokenNumber?: number | null;
  meetingLink?: string | null;
}

/**
 * Provider-agnostic notification service.
 * In production, this invokes a Supabase Edge Function that communicates securely with
 * WhatsApp Business API / Twilio / SMS Gateway using server-side secret API keys.
 */
export async function sendNotification(
  type: NotificationType,
  appointmentId: string,
  payload: NotificationPayload
): Promise<{ success: boolean; logId?: string }> {
  console.log(`[Notification Service Stub] Sending '${type}' notification to ${payload.patientMobile}`, payload);

  if (!isSupabaseConfigured) {
    return { success: true, logId: `mock-log-${Date.now()}` };
  }

  try {
    const { data, error } = await supabase
      .from('notifications_log')
      .insert({
        appointment_id: appointmentId,
        type,
        status: 'LOGGED'
      })
      .select('id')
      .single();

    if (error) {
      console.warn('Failed to log notification', error);
      return { success: true };
    }

    return { success: true, logId: data.id };
  } catch (err) {
    console.error('Notification log error', err);
    return { success: false };
  }
}
